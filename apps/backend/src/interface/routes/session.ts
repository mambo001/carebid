import { Effect } from "effect"
import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import { getSession } from "../../application/queries/get-session"
import { switchRole } from "../../application/commands/switch-role"
import { handleAppErrors, runEffect } from "../../app"
import { SessionResponseSchema, ViewerRoleSchema } from "@carebid/shared"

export const createSessionRoutes = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/session", (c) =>
    runEffect(
      c.env,
      getSession().pipe(
        Effect.map((session) =>
          c.json(Schema.decodeUnknownSync(SessionResponseSchema)({ ok: true, session })),
        ),
        handleAppErrors,
      ),
    ),
  )

  app.post("/session/role", async (c) => {
    const body = await c.req.json()
    const role = Schema.decodeUnknownSync(
      Schema.Struct({ role: Schema.optional(ViewerRoleSchema) }),
    )(body).role

    return runEffect(
      c.env,
      switchRole(role).pipe(
        Effect.map((session) =>
          c.json(Schema.decodeUnknownSync(SessionResponseSchema)({ ok: true, session })),
        ),
        handleAppErrors,
      ),
    )
  })

  return app
}
