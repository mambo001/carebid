import type { NextFunction, Request, Response } from "express"
import { Effect } from "effect"

import type { AppConfig } from "../../shared/config/runtime-env"
import { runEffect } from "../../app"
import { AuthProvider } from "../../domain/ports/auth-provider"

export type AuthenticatedRequest = Request & {
  authUserId?: string
  authEmail?: string
}

const getBearerToken = (request: Request) => {
  const authorization = request.header("Authorization")

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7)
  }

  const token = request.query.token
  return typeof token === "string" ? token : undefined
}

export const authMiddleware = (config: AppConfig) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      next()
      return
    }

    const token = getBearerToken(req)

    if (!token) {
      return res.status(401).json({ ok: false, error: "Missing or invalid Authorization header" })
    }

    try {
      const authUser = await runEffect(
        config,
        Effect.gen(function* () {
          const authProvider = yield* AuthProvider
          return yield* authProvider.validateToken(token)
        }),
      )

      req.authUserId = authUser.id
      req.authEmail = authUser.email
      next()
    } catch {
      return res.status(401).json({ ok: false, error: "Invalid or expired session" })
    }
  }
