import { Effect } from "effect"
import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { getSession } from "../../application/queries/get-session"
import { switchRole } from "../../application/commands/switch-role"
import { handleAppErrors, runEffect } from "../../app"
import { SessionResponseSchema, ViewerRoleSchema } from "@carebid/shared"

const decodeSessionResponse = Schema.decodeUnknownSync(SessionResponseSchema)
const decodeRoleBody = Schema.decodeUnknownSync(
  Schema.Struct({ role: Schema.optional(ViewerRoleSchema) }),
)

export const createSessionRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/session", (c) =>
    runEffect(
      c.env,
      Effect.gen(function* () {
        const session = yield* getSession()
        return c.json(decodeSessionResponse({ ok: true, session }))
      }).pipe(handleAppErrors),
    ),
  )

  app.post("/session/role", async (c) => {
    const { role } = decodeRoleBody(await c.req.json())

    return runEffect(
      c.env,
      Effect.gen(function* () {
        const session = yield* switchRole(role)
        return c.json(decodeSessionResponse({ ok: true, session }))
      }).pipe(handleAppErrors),
    )
  })

  return app
}
