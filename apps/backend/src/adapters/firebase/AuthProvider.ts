import { Effect, Layer, Config } from "effect"
import { initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { AuthProvider, AuthIdentity } from "../../ports/AuthProvider"
import { Unauthorized } from "../../data/errors"
import { UserId } from "../../data/branded"

export const make = Effect.gen(function* () {
  const projectId = yield* Config.string("FIREBASE_PROJECT_ID")

  // Initialize Firebase Admin (uses ADC in Cloud Run)
  const app = initializeApp({ projectId })
  const auth = getAuth(app)

  const verifyToken = (token: string) =>
    Effect.tryPromise({
      try: () => auth.verifyIdToken(token),
      catch: (error) => new Unauthorized({ message: `Invalid token: ${error}` }),
    }).pipe(
      Effect.flatMap((decoded) =>
        Effect.succeed(
          new AuthIdentity({
            userId: UserId.makeUnsafe(decoded.uid),
            firebaseUid: decoded.uid,
            email: decoded.email ?? "",
            roles: (decoded.roles as Array<"patient" | "provider">) ?? ["patient"],
          })
        )
      )
    )

  return AuthProvider.of({ verifyToken })
})

export const layer = Layer.effect(AuthProvider, make)
