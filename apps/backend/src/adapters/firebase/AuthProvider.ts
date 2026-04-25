import { Effect, Layer, Config } from "effect"
import { initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { AuthProvider, AuthIdentity } from "../../ports/AuthProvider"
import { Unauthorized } from "../../data/errors"
import { UserId } from "../../data/branded"
import { Schema } from "effect"

export const make = Effect.gen(function* () {
  const projectId = yield* Config.string("FIREBASE_PROJECT_ID")
  const emulatorHost = yield* Config.string("FIREBASE_AUTH_EMULATOR_HOST").pipe(
    Effect.option
  )

  // Initialize Firebase Admin
  // Production: Uses Application Default Credentials (ADC)
  // - Cloud Run service account
  // - GOOGLE_APPLICATION_CREDENTIALS env var
  // - gcloud auth application-default login
  const app = initializeApp({
    credential: applicationDefault(),
    projectId,
  })
  const auth = getAuth(app)

  const verifyToken = (token: string) => {
    // If emulator is configured, use emulator-aware verification
    if (emulatorHost._tag === "Some") {
      return Effect.tryPromise({
        try: () => auth.verifyIdToken(token, true), // true = check revoked
        catch: (error) => new Unauthorized({ message: `Invalid token: ${error}` }),
      }).pipe(
        Effect.flatMap((decoded) =>
          Effect.succeed({
            userId: Schema.decodeUnknownSync(UserId)(decoded.uid),
            firebaseUid: decoded.uid,
            email: decoded.email ?? "",
            roles: (decoded.roles as Array<"patient" | "provider">) ?? ["patient"],
          })
        )
      )
    }

    // Production: Use standard verification
    return Effect.tryPromise({
      try: () => auth.verifyIdToken(token),
      catch: (error) => new Unauthorized({ message: `Invalid token: ${error}` }),
    }).pipe(
      Effect.flatMap((decoded) =>
        Effect.succeed({
          userId: Schema.decodeUnknownSync(UserId)(decoded.uid),
          firebaseUid: decoded.uid,
          email: decoded.email ?? "",
          roles: (decoded.roles as Array<"patient" | "provider">) ?? ["patient"],
        })
      )
    )
  }

  return AuthProvider.of({ verifyToken })
})

export const layer = Layer.effect(AuthProvider, make)
