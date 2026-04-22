import { applicationDefault, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { Effect, Layer } from "effect"

import type { AppConfig } from "../../shared/config/runtime-env"
import { AuthError } from "../../domain/errors"
import { AuthProvider, type AuthUser } from "../../domain/ports/auth-provider"

const getFirebaseAuth = (config: AppConfig) => {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: config.firebaseProjectId,
    })
  }

  return getAuth()
}

export const makeFirebaseAuthProvider = (config: AppConfig): AuthProvider => {
  const auth = getFirebaseAuth(config)

  return {
    validateToken: (token: string): Effect.Effect<AuthUser, AuthError> =>
      Effect.tryPromise({
        try: async () => {
          const decoded = await auth.verifyIdToken(token)
          if (!decoded.uid || !decoded.email) {
            throw new AuthError({ message: "Firebase token is missing uid or email" })
          }

          return { id: decoded.uid, email: decoded.email }
        },
        catch: (error) =>
          error instanceof AuthError
            ? error
            : new AuthError({ message: `Unable to validate Firebase token: ${String(error)}` }),
      }),
  }
}

export const makeFirebaseAuthProviderLayer = (config: AppConfig) =>
  Layer.succeed(AuthProvider, makeFirebaseAuthProvider(config))
