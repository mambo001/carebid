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
import { SessionRepository } from "../../domain/ports/session-repository"
import { createPrismaClient } from "../../lib/db"

const demoAuthUserId = "demo-user-001"
const demoEmail = "demo@carebid.local"

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

const buildSession = (db: PrismaClient): Effect.Effect<AppSession, DatabaseError> =>
  Effect.gen(function* () {
    const [session, patient, provider] = yield* Effect.all([
      query(() =>
        db.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: {},
          create: { authUserId: demoAuthUserId, email: demoEmail },
        }),
      ),
      query(() => db.patient.findUnique({ where: { authUserId: demoAuthUserId } })),
      query(() =>
        db.provider.findUnique({
          where: { authUserId: demoAuthUserId },
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
    getSession: () => buildSession(prisma),

    switchRole: (role) =>
      Effect.gen(function* () {
        yield* query(() =>
          prisma.demoSession.upsert({
            where: { authUserId: demoAuthUserId },
            update: { activeRole: (role ?? null) as ViewerRole | null },
            create: {
              authUserId: demoAuthUserId,
              email: demoEmail,
              activeRole: (role ?? null) as ViewerRole | null,
            },
          }),
        )
        return yield* buildSession(prisma)
      }),

    savePatient: (input: PatientOnboardingInput) =>
      Effect.gen(function* () {
        const patient = yield* query(() =>
          prisma.patient.upsert({
            where: { authUserId: demoAuthUserId },
            update: {
              email: input.email,
              displayName: input.displayName,
              locationCity: input.locationCity,
              locationRegion: input.locationRegion,
            },
            create: {
              authUserId: demoAuthUserId,
              email: input.email,
              displayName: input.displayName,
              locationCity: input.locationCity,
              locationRegion: input.locationRegion,
            },
          }),
        )

        yield* query(() =>
          prisma.demoSession.upsert({
            where: { authUserId: demoAuthUserId },
            update: { email: input.email, activeRole: "patient" },
            create: { authUserId: demoAuthUserId, email: input.email, activeRole: "patient" },
          }),
        )

        const session = yield* buildSession(prisma)
        return { profile: mapPatientProfile(patient), session }
      }),

    saveProvider: (input: ProviderOnboardingInput) =>
      Effect.gen(function* () {
        const provider = yield* query(() =>
          prisma.provider.upsert({
            where: { authUserId: demoAuthUserId },
            update: {
              email: input.email,
              displayName: input.displayName,
              licenseRegion: input.licenseRegion,
              verificationStatus: "verified",
              verificationMode: "demo_auto",
            },
            create: {
              authUserId: demoAuthUserId,
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
            where: { authUserId: demoAuthUserId },
            update: { email: input.email, activeRole: "provider" },
            create: { authUserId: demoAuthUserId, email: input.email, activeRole: "provider" },
          }),
        )

        const providerWithCategories = yield* query(() =>
          prisma.provider.findUniqueOrThrow({
            where: { id: provider.id },
            include: { categories: true },
          }),
        )

        const session = yield* buildSession(prisma)
        return { profile: mapProviderProfile(providerWithCategories), session }
      }),
  }
}

export const makePrismaSessionRepositoryLayer = (databaseUrl: string) =>
  Layer.succeed(SessionRepository, makePrismaSessionRepository(databaseUrl))
