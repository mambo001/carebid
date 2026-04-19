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

const withPrisma = <Result>(
  prisma: PrismaClient,
  fn: (prisma: PrismaClient) => Promise<Result>,
): Effect.Effect<Result, DatabaseError> =>
  Effect.tryPromise({
    try: () => fn(prisma),
    catch: (error) => new DatabaseError({ message: String(error) }),
  }).pipe(Effect.ensuring(Effect.promise(() => prisma.$disconnect())))

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

export const makePrismaSessionRepository = (databaseUrl: string): SessionRepository => {
  const prisma = createPrismaClient(databaseUrl)

  return {
    getSession: () => withPrisma(prisma, buildSession),

    switchRole: (role) =>
      withPrisma(prisma, async (db) => {
        await db.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: { activeRole: (role ?? null) as ViewerRole | null },
          create: {
            authUserId: demoAuthUserId,
            email: demoEmail,
            activeRole: (role ?? null) as ViewerRole | null,
          },
        })
        return buildSession(db)
      }),

    savePatient: (input: PatientOnboardingInput) =>
      withPrisma(prisma, async (db) => {
        const patient = await db.patient.upsert({
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

        await db.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: { email: input.email, activeRole: "patient" },
          create: { authUserId: demoAuthUserId, email: input.email, activeRole: "patient" },
        })

        return { profile: mapPatientProfile(patient), session: await buildSession(db) }
      }),

    saveProvider: (input: ProviderOnboardingInput) =>
      withPrisma(prisma, async (db) => {
        const provider = await db.provider.upsert({
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

        await db.providerCategoryAssignment.deleteMany({ where: { providerId: provider.id } })

        if (input.categories.length > 0) {
          await db.providerCategoryAssignment.createMany({
            data: input.categories.map((category) => ({ providerId: provider.id, category })),
          })
        }

        await db.demoSession.upsert({
          where: { authUserId: demoAuthUserId },
          update: { email: input.email, activeRole: "provider" },
          create: { authUserId: demoAuthUserId, email: input.email, activeRole: "provider" },
        })

        const providerWithCategories = await db.provider.findUniqueOrThrow({
          where: { id: provider.id },
          include: { categories: true },
        })

        return { profile: mapProviderProfile(providerWithCategories), session: await buildSession(db) }
      }),
  }
}

export const makePrismaSessionRepositoryLayer = (databaseUrl: string) =>
  Layer.succeed(SessionRepository, makePrismaSessionRepository(databaseUrl))
