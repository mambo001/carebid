import { Effect } from "effect"
import { createMiddleware } from "hono/factory"

import { AuthProvider } from "../../domain/ports/auth-provider"
import { runEffect } from "../../app"

export type AuthEnv = {
  Bindings: Env
  Variables: {
    authUserId: string
    authEmail: string
  }
}

export const authMiddleware = () =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const authorization = c.req.header("Authorization")

    if (!authorization?.startsWith("Bearer ")) {
      return c.json({ ok: false, error: "Missing or invalid Authorization header" }, 401)
    }

    const token = authorization.slice(7)

    try {
      const authUser = await runEffect(
        c.env,
        Effect.gen(function* () {
          const authProvider = yield* AuthProvider
          return yield* authProvider.validateToken(token)
        }),
      )

      c.set("authUserId", authUser.id)
      c.set("authEmail", authUser.email)
      await next()
    } catch {
      return c.json({ ok: false, error: "Invalid or expired session" }, 401)
    }
  })
