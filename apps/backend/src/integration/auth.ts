import { Effect } from "effect"
import { Unauthorized } from "../data/errors"
import { UserId } from "../data/branded"
import { AuthProvider, AuthIdentity } from "../ports/AuthProvider"

export const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}

export const verifyAuthToken = (
  token: string
): Effect.Effect<AuthIdentity, Unauthorized, AuthProvider> =>
  Effect.gen(function* () {
    const authProvider = yield* AuthProvider
    return yield* authProvider.verifyToken(token)
  })

export const authenticateRequest = (
  authHeader: string | undefined
): Effect.Effect<AuthIdentity, Unauthorized, AuthProvider> => {
  const token = extractBearerToken(authHeader)
  if (!token) {
    return new Unauthorized({ message: "Missing or invalid authorization header" })
  }
  return verifyAuthToken(token)
}
