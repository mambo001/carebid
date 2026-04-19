import { Hono } from "hono"
import { Effect, Either } from "effect"
import * as Schema from "@effect/schema/Schema"

import {
  BidInputSchema,
  BidMutationResponseSchema,
  CreateCareRequestResponseSchema,
  CreateCareRequestInputSchema,
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
  RequestListResponseSchema,
  RequestRoomSnapshotSchema,
  SessionResponseSchema,
  WithdrawBidInputSchema,
  ViewerRoleSchema,
  appName,
  providerCategories,
} from "@carebid/shared"

import { getDemoSession, onboardPatient, onboardProvider, switchDemoRole } from "./demo-auth"
import { createDemoRequest, demoRequests } from "./demo-data"

export const createRouter = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/health", (c) => c.json({ ok: true, app: appName, env: c.env.APP_NAME }))

  app.get("/api/session", (c) =>
    c.json(
      Schema.decodeUnknownSync(SessionResponseSchema)({
        ok: true,
        session: getDemoSession(),
      }),
    ),
  )

  app.post("/api/session/role", async (c) => {
    const body = await c.req.json()
    const session = switchDemoRole(
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
    const result = onboardPatient(input)

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
    const result = onboardProvider(input)

    return c.json(
      Schema.decodeUnknownSync(ProviderOnboardingResponseSchema)({
        ok: true,
        ...result,
      }),
      201,
    )
  })

  app.get("/api/requests", (c) =>
    c.json(
      Schema.decodeUnknownSync(RequestListResponseSchema)({
        items: demoRequests,
        filters: providerCategories,
      }),
    ),
  )

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

        const item = createDemoRequest(decoded.right)

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

  return app
}
