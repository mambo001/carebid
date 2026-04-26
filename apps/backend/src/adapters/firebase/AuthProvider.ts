import { Effect, Layer, Config } from "effect"
import { initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { AuthProvider, AuthIdentity } from "../../ports/AuthProvider"
import { Unauthorized } from "../../data/errors"
import { UserId } from "../../data/branded"
import { User } from "../../data/entities"
import { Users } from "../../ports/Users"
import { Schema } from "effect"
import { makePrismaClient } from "../prisma/lib/prisma-client"

type ProfileIdentity = {
  readonly userId: string
  readonly email: string
}

export const profileRowsFromIdentity = (identity: ProfileIdentity) => {
  const displayName = identity.email.includes("@")
    ? identity.email.split("@")[0]
    : identity.userId

  return {
    patient: {
      id: identity.userId,
      authUserId: identity.userId,
      email: identity.email,
      displayName,
      locationCity: "",
      locationRegion: "",
    },
    provider: {
      id: identity.userId,
      authUserId: identity.userId,
      email: identity.email,
      displayName,
      licenseRegion: null,
      verificationStatus: "verified" as const,
      verificationMode: "demo_auto" as const,
    },
    providerCategory: {
      providerId: identity.userId,
      category: "imaging" as const,
    },
    user: {
      id: identity.userId,
      displayName,
      roles: ["patient", "provider"] as const,
    },
  }
}

export const make = Effect.gen(function* () {
  const projectId = yield* Config.string("FIREBASE_PROJECT_ID")
  const emulatorHost = yield* Config.string("FIREBASE_AUTH_EMULATOR_HOST").pipe(
    Effect.option
  )
  const prisma = yield* makePrismaClient
  const users = yield* Users

  // Development uses the Firebase Auth Emulator. In that mode the Admin SDK
  // must not require ADC; FIREBASE_AUTH_EMULATOR_HOST tells it where to verify.
  // Production uses Application Default Credentials from the runtime service account.
  const app = emulatorHost._tag === "Some"
    ? initializeApp({ projectId })
    : initializeApp({ credential: applicationDefault(), projectId })
  const auth = getAuth(app)

  const ensureProfiles = (identity: ProfileIdentity) => {
    const rows = profileRowsFromIdentity(identity)

    return Effect.tryPromise({
      try: async () => {
        await prisma.patient.upsert({
          where: { authUserId: identity.userId },
          create: rows.patient,
          update: {
            email: rows.patient.email,
            displayName: rows.patient.displayName,
          },
        })
        await prisma.provider.upsert({
          where: { authUserId: identity.userId },
          create: rows.provider,
          update: {
            email: rows.provider.email,
            displayName: rows.provider.displayName,
          },
        })
        await prisma.providerCategoryAssignment.upsert({
          where: {
            providerId_category: rows.providerCategory,
          },
          create: rows.providerCategory,
          update: {},
        })
        await Effect.runPromise(
          users.save(new User({
            ...rows.user,
            id: Schema.decodeUnknownSync(UserId)(rows.user.id),
            roles: ["patient", "provider"],
            createdAt: new Date(),
          }))
        )
      },
      catch: (error) => error,
    }).pipe(
      Effect.catchAll((error) =>
        Effect.logError("Failed to sync user profiles").pipe(
          Effect.annotateLogs({ error: String(error) })
        )
      )
    )
  }

  const identityFromDecoded = (decoded: { uid: string; email?: string; roles?: unknown }) =>
    Effect.gen(function* () {
      const email = decoded.email ?? ""
      yield* ensureProfiles({ userId: decoded.uid, email })

      return {
        userId: Schema.decodeUnknownSync(UserId)(decoded.uid),
        firebaseUid: decoded.uid,
        email,
        roles: (decoded.roles as Array<"patient" | "provider">) ?? ["patient"],
      }
    })

  const verifyToken = (token: string) => {
    // If emulator is configured, use emulator-aware verification
    if (emulatorHost._tag === "Some") {
      return Effect.tryPromise({
        try: () => auth.verifyIdToken(token, true), // true = check revoked
        catch: (error) => new Unauthorized({ message: `Invalid token: ${error}` }),
      }).pipe(
        Effect.flatMap(identityFromDecoded)
      )
    }

    // Production: Use standard verification
    return Effect.tryPromise({
      try: () => auth.verifyIdToken(token),
      catch: (error) => new Unauthorized({ message: `Invalid token: ${error}` }),
    }).pipe(
      Effect.flatMap(identityFromDecoded)
    )
  }

  return AuthProvider.of({ verifyToken })
})

export const layer = Layer.effect(AuthProvider, make)
