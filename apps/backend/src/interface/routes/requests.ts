import { Effect, Either } from "effect"
import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { createRequest } from "../../application/commands/create-request"
import { markRequestAwarded } from "../../application/commands/mark-request-awarded"
import { markRequestExpired } from "../../application/commands/mark-request-expired"
import { openRequest } from "../../application/commands/open-request"
import { getRequest } from "../../application/queries/get-request"
import { listRequests } from "../../application/queries/list-requests"
import { runAppEffect } from "../../app"
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

export const createRequestRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/requests", (c) =>
    runAppEffect(
      c.env,
      listRequests(),
      (items) =>
        c.json(
          Schema.decodeUnknownSync(RequestListResponseSchema)({
            items,
            filters: providerCategories,
          }),
        ),
    ),
  )

  app.post("/requests/validate", async (c) => {
    const response = await Effect.runPromise(
      Effect.gen(function* () {
        const body = yield* Effect.tryPromise(() => c.req.json())
        const decoded = Schema.decodeUnknownEither(CreateCareRequestInputSchema)(body)

        if (Either.isLeft(decoded)) {
          return c.json(
            {
              ok: false,
              error: "Invalid request payload",
              issue: decoded.left,
            },
            400,
          )
        }

        return c.json({ ok: true, item: decoded.right })
      }),
    )

    return response
  })

  app.post("/requests", async (c) => {
    const body = await c.req.json()
    const decoded = Schema.decodeUnknownEither(CreateCareRequestInputSchema)(body)

    if (Either.isLeft(decoded)) {
      return c.json(
        {
          ok: false,
          error: "Invalid request payload",
          issue: decoded.left,
        },
        400,
      )
    }

    return runAppEffect(
      c.env,
      createRequest(decoded.right),
      (item) =>
        c.json(
          Schema.decodeUnknownSync(CreateCareRequestResponseSchema)({
            ok: true,
            item,
          }),
          201,
        ),
    )
  })

  app.post("/requests/:requestId/open", (c) => {
    const requestId = c.req.param("requestId")

    return runAppEffect(
      c.env,
      openRequest(requestId),
      async (item) => {
        const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
        await room.fetch(`https://do.internal/status/sync?requestId=${requestId}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ status: item.status }),
        })

        return c.json(
          Schema.decodeUnknownSync(RequestSummaryResponseSchema)({
            ok: true,
            item,
          }),
        )
      },
    )
  })

  app.get("/requests/:requestId/room", (c) => {
    const requestId = c.req.param("requestId")

    return runAppEffect(
      c.env,
      getRequest(requestId),
      async (requestSummary) => {
        const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
        const snapshotUrl = new URL("https://do.internal/snapshot")
        snapshotUrl.searchParams.set("requestId", requestId)
        snapshotUrl.searchParams.set("status", requestSummary.status)

        const response = await room.fetch(snapshotUrl.toString())
        const json = await response.json()
        const snapshot = Schema.decodeUnknownSync(RequestRoomSnapshotSchema)(json)

        return c.json(snapshot)
      },
    )
  })

  app.get("/requests/:requestId/connect", (c) => {
    const requestId = c.req.param("requestId")
    const url = new URL(c.req.url)
    const protocol = url.protocol === "https:" ? "wss:" : "ws:"

    return c.json(
      Schema.decodeUnknownSync(RoomConnectionResponseSchema)({
        requestId,
        websocketUrl: `${protocol}//${url.host}/request-room/connect?requestId=${requestId}`,
      }),
    )
  })

  app.post("/requests/:requestId/bids", async (c) => {
    const requestId = c.req.param("requestId")
    const input = Schema.decodeUnknownSync(BidInputSchema)(await c.req.json())
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/bids/place?requestId=${requestId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    })
    const json = await response.json()

    return c.json(Schema.decodeUnknownSync(BidMutationResponseSchema)(json))
  })

  app.post("/requests/:requestId/bids/withdraw", async (c) => {
    const requestId = c.req.param("requestId")
    const input = Schema.decodeUnknownSync(WithdrawBidInputSchema)(await c.req.json())
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/bids/withdraw?requestId=${requestId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    })
    const json = await response.json()

    return c.json(Schema.decodeUnknownSync(BidMutationResponseSchema)(json))
  })

  app.post("/requests/:requestId/bids/accept", async (c) => {
    const requestId = c.req.param("requestId")
    const input = Schema.decodeUnknownSync(AcceptBidInputSchema)(await c.req.json())
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/bids/accept?requestId=${requestId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    })
    const json = await response.json()

    if (response.ok) {
      await runAppEffect(c.env, markRequestAwarded(requestId, input.bidId), () => Response.json({ ok: true }))
    }

    return c.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)(json), {
      status: response.status as 200 | 409,
    })
  })

  app.post("/requests/:requestId/expire", async (c) => {
    const requestId = c.req.param("requestId")
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/expire?requestId=${requestId}`, {
      method: "POST",
    })
    const json = await response.json()

    if (response.ok) {
      await runAppEffect(c.env, markRequestExpired(requestId), () => Response.json({ ok: true }))
    }

    return c.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)(json), {
      status: response.status as 200 | 409,
    })
  })

  return app
}
