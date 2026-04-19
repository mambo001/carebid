import { Hono } from "hono"
import { Effect, Either } from "effect"
import * as Schema from "@effect/schema/Schema"

import {
  AcceptBidInputSchema,
  BidInputSchema,
  BidMutationResponseSchema,
  CreateCareRequestResponseSchema,
  CreateCareRequestInputSchema,
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
  RequestListResponseSchema,
  RequestResolutionResponseSchema,
  RoomConnectionResponseSchema,
  RequestRoomSnapshotSchema,
  SessionResponseSchema,
  WithdrawBidInputSchema,
  ViewerRoleSchema,
  appName,
  providerCategories,
} from "@carebid/shared"

import { getSession, listRequests, savePatient, saveProvider, saveRequest, switchRole } from "./store"

export const createRouter = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/health", (c) => c.json({ ok: true, app: appName, env: c.env.APP_NAME }))

  app.get("/api/session", (c) =>
    Effect.runPromise(
      Effect.gen(function* () {
        const session = yield* Effect.tryPromise(() => getSession(c.env))

        return c.json(
          Schema.decodeUnknownSync(SessionResponseSchema)({
            ok: true,
            session,
          }),
        )
      }),
    ),
  )

  app.post("/api/session/role", async (c) => {
    const body = await c.req.json()
    const session = await switchRole(
      c.env,
      Schema.decodeUnknownSync(
        Schema.Struct({
          role: Schema.optional(ViewerRoleSchema),
        }),
      )(body).role,
    )

    return c.json(
      Schema.decodeUnknownSync(SessionResponseSchema)({
        ok: true,
        session,
      }),
    )
  })

  app.post("/api/onboarding/patient", async (c) => {
    const body = await c.req.json()
    const input = Schema.decodeUnknownSync(PatientOnboardingInputSchema)(body)
    const result = await savePatient(c.env, input)

    return c.json(
      Schema.decodeUnknownSync(PatientOnboardingResponseSchema)({
        ok: true,
        ...result,
      }),
      201,
    )
  })

  app.post("/api/onboarding/provider", async (c) => {
    const body = await c.req.json()
    const input = Schema.decodeUnknownSync(ProviderOnboardingInputSchema)(body)
    const result = await saveProvider(c.env, input)

    return c.json(
      Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)({
        ok: true,
        ...result,
      }),
      201,
    )
  })

  app.get("/api/requests", async (c) => {
    const items = await listRequests(c.env)

    return c.json(
      Schema.decodeUnknownSync(RequestListResponseSchema)({
        items,
        filters: providerCategories,
      }),
    )
  })

  app.post("/api/requests/validate", async (c) => {
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

  app.post("/api/requests", async (c) => {
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

        const item = yield* Effect.tryPromise(() => saveRequest(c.env, decoded.right))

        return c.json(
          Schema.decodeUnknownSync(CreateCareRequestResponseSchema)({
            ok: true,
            item,
          }),
          201,
        )
      }),
    )

    return response
  })

  app.get("/api/requests/:requestId/room", async (c) => {
    const requestId = c.req.param("requestId")
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/snapshot?requestId=${requestId}`)
    const json = await response.json()
    const snapshot = Schema.decodeUnknownSync(RequestRoomSnapshotSchema)(json)

    return c.json(snapshot)
  })

  app.get("/api/requests/:requestId/connect", (c) => {
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

  app.post("/api/requests/:requestId/bids", async (c) => {
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

  app.post("/api/requests/:requestId/bids/withdraw", async (c) => {
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

  app.post("/api/requests/:requestId/bids/accept", async (c) => {
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

    return c.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)(json), {
      status: response.status as 200 | 409,
    })
  })

  app.post("/api/requests/:requestId/expire", async (c) => {
    const requestId = c.req.param("requestId")
    const room = c.env.REQUEST_ROOM_DO.get(c.env.REQUEST_ROOM_DO.idFromName(requestId))
    const response = await room.fetch(`https://do.internal/expire?requestId=${requestId}`, {
      method: "POST",
    })
    const json = await response.json()

    return c.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)(json), {
      status: response.status as 200 | 409,
    })
  })

  return app
}
