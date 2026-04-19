import type {
  AppSession,
  CreateCareRequestInput,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
  RequestSummary,
} from "@carebid/shared"
import type { PrismaClient, ViewerRole } from "@prisma/client"

import { createPrismaClient } from "./db"
import { getDemoSession, onboardPatient, onboardProvider, switchDemoRole } from "./demo-auth"
import { createDemoRequest, demoRequests } from "./demo-data"

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

const mapRequestSummary = (request: {
  id: string
  category: "specialist_consult" | "imaging"
  title: string
  sanitizedSummary: string
  targetBudgetCents: number
  locationCity: string
  locationRegion: string
  preferredStartDate: Date
  preferredEndDate: Date
  urgency: "routine" | "soon" | "urgent"
  serviceMode: "in_person" | "telehealth" | "either"
  status: "draft" | "open" | "awarded" | "expired"
  expiresAt: Date
}): RequestSummary => ({
  id: request.id,
  category: request.category,
  title: request.title,
  sanitizedSummary: request.sanitizedSummary,
  targetBudgetCents: request.targetBudgetCents,
  locationCity: request.locationCity,
  locationRegion: request.locationRegion,
  preferredStartDate: request.preferredStartDate.toISOString(),
  preferredEndDate: request.preferredEndDate.toISOString(),
  urgency: request.urgency,
  serviceMode: request.serviceMode,
  status: request.status,
  expiresAt: request.expiresAt.toISOString(),
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

export const getSession = async (env: Env): Promise<AppSession> => {
  const persisted = await withPrisma(env, buildSession)

  return persisted ?? getDemoSession()
}

export const switchRole = async (env: Env, role: AppSession["role"]): Promise<AppSession> => {
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
}

export const savePatient = async (env: Env, input: PatientOnboardingInput) => {
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
}

export const saveProvider = async (env: Env, input: ProviderOnboardingInput) => {
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
}

export const listRequests = async (env: Env): Promise<RequestSummary[]> => {
  const persisted = await withPrisma(env, async (prisma) => {
    const requests = await prisma.careRequest.findMany({
      orderBy: { createdAt: "desc" },
    })

    return requests.map(mapRequestSummary)
  })

  return persisted ?? demoRequests
}

export const saveRequest = async (env: Env, input: CreateCareRequestInput): Promise<RequestSummary> => {
  const persisted = await withPrisma(env, async (prisma) => {
    const patient = await prisma.patient.upsert({
      where: { authUserId: demoAuthUserId },
      update: {},
      create: {
        authUserId: demoAuthUserId,
        email: demoEmail,
        displayName: "Demo Patient",
        locationCity: input.locationCity,
        locationRegion: input.locationRegion,
      },
    })

    const request = await prisma.careRequest.create({
      data: {
        patientId: patient.id,
        category: input.category,
        title: input.title,
        sanitizedSummary: input.sanitizedSummary,
        targetBudgetCents: input.targetBudgetCents,
        locationCity: input.locationCity,
        locationRegion: input.locationRegion,
        preferredStartDate: new Date(input.preferredStartDate),
        preferredEndDate: new Date(input.preferredEndDate),
        urgency: input.urgency,
        serviceMode: input.serviceMode,
        details: input.details,
        status: "draft",
        expiresAt: new Date(input.expiresAt),
      },
    })

    return mapRequestSummary(request)
  })

  return persisted ?? createDemoRequest(input)
}
