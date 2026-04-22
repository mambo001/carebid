import { HttpRouter } from "@effect/platform"
import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

import { SessionResponseSchema, ViewerRoleSchema } from "@carebid/shared"

import { switchRole } from "../application/commands/switch-role"
import { getSession } from "../application/queries/get-session"
import { authenticate, decodeBody, json } from "./common"

const decodeRoleBody = Schema.decodeUnknownSync(Schema.Struct({ role: Schema.optional(ViewerRoleSchema) }))
const decodeSessionResponse = Schema.decodeUnknownSync(SessionResponseSchema)

export const sessionRouter = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/api/session",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const session = yield* getSession(identity)
      return json(decodeSessionResponse({ ok: true, session }))
    }),
  ),
  HttpRouter.post(
    "/api/session/role",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const { role } = decodeRoleBody(yield* decodeBody(Schema.Struct({ role: Schema.optional(ViewerRoleSchema) }), "Invalid role payload"))
      const session = yield* switchRole(identity, role)
      return json(decodeSessionResponse({ ok: true, session }))
    }),
  ),
)
