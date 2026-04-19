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
import { getDemoSession, onboardPatient, onboardProvider, switchDemoRole } from "../../lib/demo-auth"

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

const withPrisma = <Result>(
  env: Env,
  fn: (prisma: PrismaClient) => Promise<Result>,
): Effect.Effect<Result | undefined, DatabaseError> => {
  if (!env.DATABASE_URL) {
    return Effect.succeed(undefined)
  }

  const prisma = createPrismaClient(env.DATABASE_URL)

  return Effect.tryPromise({
    try: () => fn(prisma),
    catch: (error) => new DatabaseError({ message: String(error) }),
  }).pipe(Effect.ensuring(Effect.promise(() => prisma.$disconnect())))
}

const buildSession = (prisma: PrismaClient): Promise<AppSession> =>
  Promise.all([
    prisma.demoSession.upsert({
      where: { authUserId: demoAuthUserId },
      update: {},
      create: { authUserId: demoAuthUserId, email: demoEmail },
    }),
    prisma.patient.findUnique({ where: { authUserId: demoAuthUserId } }),
    prisma.provider.findUnique({
      where: { authUserId: demoAuthUserId },
      include: { categories: true },
    }),
  ]).then(([session, patient, provider]) => ({
    mode: "demo" as const,
    authUserId: session.authUserId,
    email: session.email,
    role: session.activeRole ?? undefined,
    patientProfile: patient ? mapPatientProfile(patient) : undefined,
    providerProfile: provider ? mapProviderProfile(provider) : undefined,
  }))

const makeLiveSessionRepository = (env: Env): SessionRepository => ({
  getSession: () =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, buildSession)
      return persisted ?? getDemoSession()
    }),

  switchRole: (role) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        await prisma.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: { activeRole: (role ?? null) as ViewerRole | null },
          create: {
            authUserId: demoAuthUserId,
            email: demoEmail,
            activeRole: (role ?? null) as ViewerRole | null,
          },
        })

        return buildSession(prisma)
      })

      return persisted ?? switchDemoRole(role)
    }),

  savePatient: (input: PatientOnboardingInput) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const patient = await prisma.patient.upsert({
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
        })

        await prisma.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: { email: input.email, activeRole: "patient" },
          create: { authUserId: demoAuthUserId, email: input.email, activeRole: "patient" },
        })

        return {
          profile: mapPatientProfile(patient),
          session: await buildSession(prisma),
        }
      })

      return persisted ?? onboardPatient(input)
    }),

  saveProvider: (input: ProviderOnboardingInput) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const provider = await prisma.provider.upsert({
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
        })

        await prisma.providerCategoryAssignment.deleteMany({ where: { providerId: provider.id } })

        if (input.categories.length > 0) {
          await prisma.providerCategoryAssignment.createMany({
            data: input.categories.map((category) => ({ providerId: provider.id, category })),
          })
        }

        await prisma.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: { email: input.email, activeRole: "provider" },
          create: { authUserId: demoAuthUserId, email: input.email, activeRole: "provider" },
        })

        const providerWithCategories = await prisma.provider.findUniqueOrThrow({
          where: { id: provider.id },
          include: { categories: true },
        })

        return {
          profile: mapProviderProfile(providerWithCategories),
          session: await buildSession(prisma),
        }
      })

      return persisted ?? onboardProvider(input)
    }),
})

export const makeSessionRepositoryLayer = (env: Env) =>
  Layer.succeed(SessionRepository, makeLiveSessionRepository(env))
