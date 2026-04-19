import { Hono } from "hono"
import { Effect, Either } from "effect"
import * as Schema from "@effect/schema/Schema"

import {
  CreateCareRequestResponseSchema,
  CreateCareRequestInputSchema,
  RequestListResponseSchema,
  RequestRoomSnapshotSchema,
  appName,
  providerCategories,
} from "@carebid/shared"

import { createDemoRequest, demoRequests } from "./demo-data"

export const createRouter = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/health", (c) => c.json({ ok: true, app: appName, env: c.env.APP_NAME }))

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

  return app
}
