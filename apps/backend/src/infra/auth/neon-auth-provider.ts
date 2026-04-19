import { Effect, Layer } from "effect"

import { AuthError, DatabaseError } from "../../domain/errors"
import { AuthProvider, type AuthUser } from "../../domain/ports/auth-provider"
import { createPrismaClient } from "../../lib/db"

const query = <Result>(fn: () => Promise<Result>): Effect.Effect<Result, DatabaseError> =>
  Effect.tryPromise({
    try: fn,
    catch: (error) => new DatabaseError({ message: String(error) }),
  })

export const makeNeonAuthProvider = (databaseUrl: string): AuthProvider => {
  const prisma = createPrismaClient(databaseUrl)

  return {
    validateToken: (token: string): Effect.Effect<AuthUser, AuthError | DatabaseError> =>
      Effect.gen(function* () {
        const rows = yield* query(() =>
          prisma.$queryRawUnsafe<Array<{ user_id: string; email: string }>>(
            `SELECT s."userId" as user_id, u."email" as email
             FROM "neon_auth"."session" s
             JOIN "neon_auth"."user" u ON u."id" = s."userId"
             WHERE s."token" = $1
               AND s."expiresAt" > NOW()
             LIMIT 1`,
            token,
          ),
        )

        if (rows.length === 0) {
          return yield* Effect.fail(new AuthError({ message: "Invalid or expired session token" }))
        }

        return { id: rows[0].user_id, email: rows[0].email }
      }),
  }
}

export const makeNeonAuthProviderLayer = (databaseUrl: string) =>
  Layer.succeed(AuthProvider, makeNeonAuthProvider(databaseUrl))
