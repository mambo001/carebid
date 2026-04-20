import { Effect, Layer } from "effect"
import type { PrismaClient, ViewerRole } from "@prisma/client"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

import { DatabaseError } from "../../domain/errors"
import { SessionRepository, type AuthIdentity } from "../../domain/ports/session-repository"
import { createPrismaClient } from "../../lib/db"

const mapPatientProfile = (patient: {
  id: string
  authUserId: string
  email: string
  displayName: string
  locationCity: string
  locationRegion: string
}): PatientProfile => ({
  id: patient.id,
  authUserId: patient.authUserId,
  email: patient.email,
  displayName: patient.displayName,
  locationCity: patient.locationCity,
  locationRegion: patient.locationRegion,
})

const mapProviderProfile = (provider: {
  id: string
  authUserId: string
  email: string
  displayName: string
  licenseRegion: string | null
  verificationStatus: "verified"
  verificationMode: "demo_auto"
  categories: Array<{ category: "specialist_consult" | "imaging" }>
}): ProviderProfile => ({
  id: provider.id,
  authUserId: provider.authUserId,
  email: provider.email,
  displayName: provider.displayName,
  licenseRegion: provider.licenseRegion ?? undefined,
  verificationStatus: provider.verificationStatus,
  verificationMode: provider.verificationMode,
  categories: provider.categories.map((item) => item.category),
})

const query = <Result>(fn: () => Promise<Result>): Effect.Effect<Result, DatabaseError> =>
  Effect.tryPromise({
    try: fn,
    catch: (error) => new DatabaseError({ message: String(error) }),
  })

type RawSessionRow = {
  auth_user_id: string
  email: string
  role: "patient" | "provider" | null
  patient_profile: PatientProfile | null
  provider_profile: {
    id: string
    authUserId: string
    email: string
    displayName: string
    licenseRegion: string | null
    verificationStatus: "verified"
    verificationMode: "demo_auto"
    categories: Array<"specialist_consult" | "imaging">
  } | null
}

const sessionSnapshotSql = `
  WITH session_row AS (
    INSERT INTO "DemoSession" ("authUserId", "email", "createdAt", "updatedAt")
    VALUES ($1, $2, NOW(), NOW())
    ON CONFLICT ("authUserId")
    DO UPDATE SET "email" = EXCLUDED."email", "updatedAt" = NOW()
    RETURNING "authUserId", "email", "activeRole"
  )
  SELECT
    session_row."authUserId" AS auth_user_id,
    session_row."email" AS email,
    session_row."activeRole" AS role,
    (
      SELECT row_to_json(patient_payload)
      FROM (
        SELECT
          p."id",
          p."authUserId",
          p."email",
          p."displayName",
          p."locationCity",
          p."locationRegion"
        FROM "Patient" p
        WHERE p."authUserId" = $1
        LIMIT 1
      ) AS patient_payload
    ) AS patient_profile,
    (
      SELECT row_to_json(provider_payload)
      FROM (
        SELECT
          p."id",
          p."authUserId",
          p."email",
          p."displayName",
          p."licenseRegion",
          p."verificationStatus",
          p."verificationMode",
          COALESCE(array_agg(pca."category") FILTER (WHERE pca."category" IS NOT NULL), '{}') AS categories
        FROM "Provider" p
        LEFT JOIN "ProviderCategoryAssignment" pca ON pca."providerId" = p."id"
        WHERE p."authUserId" = $1
        GROUP BY p."id"
        LIMIT 1
      ) AS provider_payload
    ) AS provider_profile
  FROM session_row
`

const buildSessionFromRow = (row: RawSessionRow): AppSession => ({
  mode: "demo",
  authUserId: row.auth_user_id,
  email: row.email,
  role: row.role ?? undefined,
  patientProfile: row.patient_profile ?? undefined,
  providerProfile: row.provider_profile
    ? {
        id: row.provider_profile.id,
        authUserId: row.provider_profile.authUserId,
        email: row.provider_profile.email,
        displayName: row.provider_profile.displayName,
        licenseRegion: row.provider_profile.licenseRegion ?? undefined,
        verificationStatus: row.provider_profile.verificationStatus,
        verificationMode: row.provider_profile.verificationMode,
        categories: row.provider_profile.categories,
      }
    : undefined,
})

const loadSessionSnapshot = (
  db: PrismaClient,
  identity: AuthIdentity,
): Effect.Effect<AppSession, DatabaseError> =>
  Effect.gen(function* () {
    const rows = yield* query(() =>
      db.$queryRawUnsafe<Array<RawSessionRow>>(sessionSnapshotSql, identity.authUserId, identity.email),
    )

    return buildSessionFromRow(rows[0])
  })

const buildSession = (
  db: PrismaClient,
  identity: AuthIdentity,
): Effect.Effect<AppSession, DatabaseError> =>
  Effect.gen(function* () {
    const [session, patient, provider] = yield* Effect.all([
      query(() =>
        db.demoSession.upsert({
          where: { authUserId: identity.authUserId },
          update: {},
          create: { authUserId: identity.authUserId, email: identity.email },
        }),
      ),
      query(() => db.patient.findUnique({ where: { authUserId: identity.authUserId } })),
      query(() =>
        db.provider.findUnique({
          where: { authUserId: identity.authUserId },
          include: { categories: true },
        }),
      ),
    ], { concurrency: "unbounded" })

    return {
      mode: "demo" as const,
      authUserId: session.authUserId,
      email: session.email,
      role: session.activeRole ?? undefined,
      patientProfile: patient ? mapPatientProfile(patient) : undefined,
      providerProfile: provider ? mapProviderProfile(provider) : undefined,
    }
  })

export const makePrismaSessionRepository = (databaseUrl: string): SessionRepository => {
  const prisma = createPrismaClient(databaseUrl)

  return {
      getSession: (identity) => loadSessionSnapshot(prisma, identity),

    switchRole: (identity, role) =>
      Effect.gen(function* () {
        yield* query(() =>
          prisma.demoSession.upsert({
            where: { authUserId: identity.authUserId },
            update: { activeRole: (role ?? null) as ViewerRole | null },
            create: {
              authUserId: identity.authUserId,
              email: identity.email,
              activeRole: (role ?? null) as ViewerRole | null,
            },
          }),
        )
        return yield* loadSessionSnapshot(prisma, identity)
      }),

    savePatient: (identity, input: PatientOnboardingInput) =>
      Effect.gen(function* () {
        const patient = yield* query(() =>
          prisma.patient.upsert({
            where: { authUserId: identity.authUserId },
            update: {
              email: input.email,
              displayName: input.displayName,
              locationCity: input.locationCity,
              locationRegion: input.locationRegion,
            },
            create: {
              authUserId: identity.authUserId,
              email: input.email,
              displayName: input.displayName,
              locationCity: input.locationCity,
              locationRegion: input.locationRegion,
            },
          }),
        )

        yield* query(() =>
          prisma.demoSession.upsert({
            where: { authUserId: identity.authUserId },
            update: { email: input.email, activeRole: "patient" },
            create: { authUserId: identity.authUserId, email: input.email, activeRole: "patient" },
          }),
        )

        const session = yield* buildSession(prisma, identity)
        return { profile: mapPatientProfile(patient), session }
      }),

    saveProvider: (identity, input: ProviderOnboardingInput) =>
      Effect.gen(function* () {
        const provider = yield* query(() =>
          prisma.provider.upsert({
            where: { authUserId: identity.authUserId },
            update: {
              email: input.email,
              displayName: input.displayName,
              licenseRegion: input.licenseRegion,
              verificationStatus: "verified",
              verificationMode: "demo_auto",
            },
            create: {
              authUserId: identity.authUserId,
              email: input.email,
              displayName: input.displayName,
              licenseRegion: input.licenseRegion,
              verificationStatus: "verified",
              verificationMode: "demo_auto",
            },
          }),
        )

        yield* query(() =>
          prisma.providerCategoryAssignment.deleteMany({ where: { providerId: provider.id } }),
        )

        if (input.categories.length > 0) {
          yield* query(() =>
            prisma.providerCategoryAssignment.createMany({
              data: input.categories.map((category) => ({ providerId: provider.id, category })),
            }),
          )
        }

        yield* query(() =>
          prisma.demoSession.upsert({
            where: { authUserId: identity.authUserId },
            update: { email: input.email, activeRole: "provider" },
            create: { authUserId: identity.authUserId, email: input.email, activeRole: "provider" },
          }),
        )

        const providerWithCategories = yield* query(() =>
          prisma.provider.findUniqueOrThrow({
            where: { id: provider.id },
            include: { categories: true },
          }),
        )

        const session = yield* buildSession(prisma, identity)
        return { profile: mapProviderProfile(providerWithCategories), session }
      }),
  }
}

export const makePrismaSessionRepositoryLayer = (databaseUrl: string) =>
  Layer.succeed(SessionRepository, makePrismaSessionRepository(databaseUrl))
