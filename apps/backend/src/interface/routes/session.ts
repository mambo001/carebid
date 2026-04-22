import express from "express"
import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

import type { AppConfig } from "../../shared/config/runtime-env"
import { runEffect, sendErrorResponse } from "../../app"
import { switchRole } from "../../application/commands/switch-role"
import { getSession } from "../../application/queries/get-session"
import { SessionResponseSchema, ViewerRoleSchema } from "@carebid/shared"
import type { AuthenticatedRequest } from "../middleware/auth"

const decodeSessionResponse = Schema.decodeUnknownSync(SessionResponseSchema)
const decodeRoleBody = Schema.decodeUnknownSync(Schema.Struct({ role: Schema.optional(ViewerRoleSchema) }))

export const createSessionRoutes = (config: AppConfig) => {
  const router = express.Router()

  router.get("/session", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const session = yield* getSession(identity)
          return decodeSessionResponse({ ok: true, session })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/session/role", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const { role } = decodeRoleBody(req.body)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const session = yield* switchRole(identity, role)
          return decodeSessionResponse({ ok: true, session })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  return router
}
