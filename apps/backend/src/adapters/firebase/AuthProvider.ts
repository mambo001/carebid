import { Effect, Layer, Config } from "effect"
import { initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { AuthProvider, AuthIdentity } from "../../ports/AuthProvider"
import { Unauthorized } from "../../data/errors"
import { UserId } from "../../data/branded"
import { Schema } from "effect"

export const make = Effect.gen(function* () {
  const projectId = yield* Config.string("FIREBASE_PROJECT_ID")

  // Initialize Firebase Admin with Application Default Credentials
  // This works with:
  // - gcloud auth application-default login (local dev)
  // - GOOGLE_APPLICATION_CREDENTIALS env var
  // - Cloud Run service account (production)
  const app = initializeApp({
    credential: applicationDefault(),
    projectId,
  })
  const auth = getAuth(app)

  const verifyToken = (token: string) =>
    Effect.tryPromise({
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

  return AuthProvider.of({ verifyToken })
})

export const layer = Layer.effect(AuthProvider, make)
