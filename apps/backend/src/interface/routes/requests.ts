import { Effect, Either } from "effect"
import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { DatabaseError } from "../../domain/errors"
import { createRequest } from "../../application/commands/create-request"
import { markRequestAwarded } from "../../application/commands/mark-request-awarded"
import { markRequestExpired } from "../../application/commands/mark-request-expired"
import { openRequest } from "../../application/commands/open-request"
import { getRequest } from "../../application/queries/get-request"
import { listRequests } from "../../application/queries/list-requests"
import { handleAppErrors, runEffect } from "../../app"
import {
  AcceptBidInputSchema,
  BidInputSchema,
  BidMutationResponseSchema,
  CreateCareRequestInputSchema,
  CreateCareRequestResponseSchema,
  RequestListResponseSchema,
  RequestResolutionResponseSchema,
  RequestRoomSnapshotSchema,
  RequestSummaryResponseSchema,
  RoomConnectionResponseSchema,
  WithdrawBidInputSchema,
  providerCategories,
} from "@carebid/shared"
import type { AuthEnv } from "../middleware/auth"

const decodeCreateCareRequestInput = Schema.decodeUnknownEither(CreateCareRequestInputSchema)
const decodeRequestListResponse = Schema.decodeUnknownSync(RequestListResponseSchema)
const decodeCreateCareRequestResponse = Schema.decodeUnknownSync(CreateCareRequestResponseSchema)
const decodeRequestSummaryResponse = Schema.decodeUnknownSync(RequestSummaryResponseSchema)
const decodeRequestRoomSnapshot = Schema.decodeUnknownSync(RequestRoomSnapshotSchema)
const decodeRoomConnectionResponse = Schema.decodeUnknownSync(RoomConnectionResponseSchema)
const decodeBidInput = Schema.decodeUnknownSync(BidInputSchema)
const decodeWithdrawBidInput = Schema.decodeUnknownSync(WithdrawBidInputSchema)
const decodeAcceptBidInput = Schema.decodeUnknownSync(AcceptBidInputSchema)
const decodeBidMutationResponse = Schema.decodeUnknownSync(BidMutationResponseSchema)
const decodeResolutionResponse = Schema.decodeUnknownSync(RequestResolutionResponseSchema)

export const createRequestRoutes = () => {
  const app = new Hono<AuthEnv>()

  app.get("/requests", (c) =>
    runEffect(
      c.env,
      Effect.gen(function* () {
        const items = yield* listRequests()
        return c.json(decodeRequestListResponse({ items, filters: providerCategories }))
      }).pipe(handleAppErrors),
    ),
  )

  app.post("/requests/validate", async (c) => {
    const decoded = decodeCreateCareRequestInput(await c.req.json())

    if (Either.isLeft(decoded)) {
      return c.json({ ok: false, error: "Invalid request payload", issue: decoded.left }, 400)
    }

    return c.json({ ok: true, item: decoded.right })
  })

  app.post("/requests", async (c) => {
    const identity = { authUserId: c.get("authUserId"), email: c.get("authEmail") }
    const decoded = decodeCreateCareRequestInput(await c.req.json())

    if (Either.isLeft(decoded)) {
      return c.json({ ok: false, error: "Invalid request payload", issue: decoded.left }, 400)
    }

    return runEffect(
      c.env,
      Effect.gen(function* () {
        const item = yield* createRequest(identity, decoded.right)
        return c.json(decodeCreateCareRequestResponse({ ok: true, item }), 201)
      }).pipe(handleAppErrors),
    )
  })

  app.post("/requests/:requestId/open", (c) => {
    const requestId = c.req.param("requestId")

    return runEffect(
      c.env,
      Effect.gen(function* () {
        const item = yield* openRequest(requestId)

        yield* Effect.tryPromise({
          try: () => {
            const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
            return room.fetch(`https://do.internal/status/sync?requestId=${requestId}`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ status: item.status }),
            })
          },
          catch: () => new DatabaseError({ message: "Failed to sync room status" }),
        })

        return c.json(decodeRequestSummaryResponse({ ok: true, item }))
      }).pipe(handleAppErrors),
    )
  })

  app.get("/requests/:requestId/room", (c) => {
    const requestId = c.req.param("requestId")

    return runEffect(
      c.env,
      Effect.gen(function* () {
        const requestSummary = yield* getRequest(requestId)

        const snapshot = yield* Effect.tryPromise({
          try: async () => {
            const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
            const snapshotUrl = new URL("https://do.internal/snapshot")
            snapshotUrl.searchParams.set("requestId", requestId)
            snapshotUrl.searchParams.set("status", requestSummary.status)
            const response = await room.fetch(snapshotUrl.toString())
            return await response.json()
          },
          catch: () => new DatabaseError({ message: "Failed to fetch room snapshot" }),
        })

        return c.json(decodeRequestRoomSnapshot(snapshot))
      }).pipe(handleAppErrors),
    )
  })

  app.get("/requests/:requestId/connect", (c) => {
    const requestId = c.req.param("requestId")
    const url = new URL(c.req.url)
    const protocol = url.protocol === "https:" ? "wss:" : "ws:"

    return c.json(
      decodeRoomConnectionResponse({
        requestId,
        websocketUrl: `${protocol}//${url.host}/request-room/connect?requestId=${requestId}`,
      }),
    )
  })

  app.post("/requests/:requestId/bids", async (c) => {
    const requestId = c.req.param("requestId")
    const input = decodeBidInput(await c.req.json())
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/bids/place?requestId=${requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })

    return c.json(decodeBidMutationResponse(await response.json()))
  })

  app.post("/requests/:requestId/bids/withdraw", async (c) => {
    const requestId = c.req.param("requestId")
    const input = decodeWithdrawBidInput(await c.req.json())
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/bids/withdraw?requestId=${requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })

    return c.json(decodeBidMutationResponse(await response.json()))
  })

  app.post("/requests/:requestId/bids/accept", async (c) => {
    const requestId = c.req.param("requestId")
    const input = decodeAcceptBidInput(await c.req.json())
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/bids/accept?requestId=${requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
    const json = await response.json()

    if (response.ok) {
      await runEffect(
        c.env,
        markRequestAwarded(requestId, input.bidId).pipe(handleAppErrors),
      )
    }

    return c.json(decodeResolutionResponse(json), { status: response.status as 200 | 409 })
  })

  app.post("/requests/:requestId/expire", async (c) => {
    const requestId = c.req.param("requestId")
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/expire?requestId=${requestId}`, {
      method: "POST",
    })
    const json = await response.json()

    if (response.ok) {
      await runEffect(
        c.env,
        markRequestExpired(requestId).pipe(handleAppErrors),
      )
    }

    return c.json(decodeResolutionResponse(json), { status: response.status as 200 | 409 })
  })

  return app
}
