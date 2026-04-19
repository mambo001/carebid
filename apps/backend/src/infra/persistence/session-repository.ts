import { Layer } from "effect"
import type { PrismaClient, ViewerRole } from "@prisma/client"

import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

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

const withPrisma = async <Result>(
  env: Env,
  fn: (prisma: PrismaClient) => Promise<Result>,
): Promise<Result | undefined> => {
  if (!env.DATABASE_URL) {
    return undefined
  }

  const prisma = createPrismaClient(env.DATABASE_URL)

  try {
    return await fn(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

const buildSession = async (prisma: PrismaClient): Promise<AppSession> => {
  const [session, patient, provider] = await Promise.all([
    prisma.demoSession.upsert({
      where: { authUserId: demoAuthUserId },
      update: {},
      create: {
        authUserId: demoAuthUserId,
        email: demoEmail,
      },
    }),
    prisma.patient.findUnique({
      where: { authUserId: demoAuthUserId },
    }),
    prisma.provider.findUnique({
      where: { authUserId: demoAuthUserId },
      include: { categories: true },
    }),
  ])

  return {
    mode: "demo",
    authUserId: session.authUserId,
    email: session.email,
    role: session.activeRole ?? undefined,
    patientProfile: patient ? mapPatientProfile(patient) : undefined,
    providerProfile: provider ? mapProviderProfile(provider) : undefined,
  }
}

const makeLiveSessionRepository = (env: Env): SessionRepository => ({
  getSession: async () => {
    const persisted = await withPrisma(env, buildSession)

    return persisted ?? getDemoSession()
  },
  switchRole: async (role) => {
    const persisted = await withPrisma(env, async (prisma) => {
      await prisma.demoSession.upsert({
        where: { authUserId: demoAuthUserId },
        update: {
          activeRole: (role ?? null) as ViewerRole | null,
        },
        create: {
          authUserId: demoAuthUserId,
          email: demoEmail,
          activeRole: (role ?? null) as ViewerRole | null,
        },
      })

      return buildSession(prisma)
    })

    return persisted ?? switchDemoRole(role)
  },
  savePatient: async (input: PatientOnboardingInput) => {
    const persisted = await withPrisma(env, async (prisma) => {
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
        update: {
          email: input.email,
          activeRole: "patient",
        },
        create: {
          authUserId: demoAuthUserId,
          email: input.email,
          activeRole: "patient",
        },
      })

      return {
        profile: mapPatientProfile(patient),
        session: await buildSession(prisma),
      }
    })

    return persisted ?? onboardPatient(input)
  },
  saveProvider: async (input: ProviderOnboardingInput) => {
    const persisted = await withPrisma(env, async (prisma) => {
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

      await prisma.providerCategoryAssignment.deleteMany({
        where: { providerId: provider.id },
      })

      if (input.categories.length > 0) {
        await prisma.providerCategoryAssignment.createMany({
          data: input.categories.map((category) => ({
            providerId: provider.id,
            category,
          })),
        })
      }

      await prisma.demoSession.upsert({
        where: { authUserId: demoAuthUserId },
        update: {
          email: input.email,
          activeRole: "provider",
        },
        create: {
          authUserId: demoAuthUserId,
          email: input.email,
          activeRole: "provider",
        },
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
  },
})

export const makeSessionRepositoryLayer = (env: Env) =>
  Layer.succeed(SessionRepository, makeLiveSessionRepository(env))
