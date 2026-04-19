import { Effect, Layer } from "effect"
import type { PrismaClient } from "@prisma/client"

import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

import { DatabaseError, RequestNotFoundError } from "../../domain/errors"
import { RequestRepository } from "../../domain/ports/request-repository"
import { createPrismaClient } from "../../lib/db"
import { createDemoRequest, demoRequests } from "../../lib/demo-data"

const demoAuthUserId = "demo-user-001"
const demoEmail = "demo@carebid.local"

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

const makeLiveRequestRepository = (env: Env): RequestRepository => ({
  listRequests: () =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const requests = await prisma.careRequest.findMany({ orderBy: { createdAt: "desc" } })
        return requests.map(mapRequestSummary)
      })

      return persisted ?? demoRequests
    }),

  getRequest: (requestId) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const request = await prisma.careRequest.findUnique({ where: { id: requestId } })
        return request ? mapRequestSummary(request) : undefined
      })

      const result = persisted ?? demoRequests.find((r) => r.id === requestId)

      if (!result) {
        return yield* Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }

      return result
    }),

  createRequest: (input: CreateCareRequestInput) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
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
    }),

  openRequest: (requestId) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const request = await prisma.careRequest.update({
          where: { id: requestId },
          data: { status: "open" },
        })
        return mapRequestSummary(request)
      })

      if (persisted) return persisted

      const index = demoRequests.findIndex((r) => r.id === requestId)

      if (index === -1) {
        return yield* Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }

      const next = { ...demoRequests[index], status: "open" as const }
      demoRequests[index] = next

      return next
    }),

  markRequestAwarded: (requestId, bidId) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const request = await prisma.careRequest.update({
          where: { id: requestId },
          data: { status: "awarded", awardedBidId: bidId },
        })
        return mapRequestSummary(request)
      })

      if (persisted) return persisted

      const index = demoRequests.findIndex((r) => r.id === requestId)

      if (index === -1) {
        return yield* Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }

      const next = { ...demoRequests[index], status: "awarded" as const }
      demoRequests[index] = next

      return next
    }),

  markRequestExpired: (requestId) =>
    Effect.gen(function* () {
      const persisted = yield* withPrisma(env, async (prisma) => {
        const request = await prisma.careRequest.update({
          where: { id: requestId },
          data: { status: "expired" },
        })
        return mapRequestSummary(request)
      })

      if (persisted) return persisted

      const index = demoRequests.findIndex((r) => r.id === requestId)

      if (index === -1) {
        return yield* Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }

      const next = { ...demoRequests[index], status: "expired" as const }
      demoRequests[index] = next

      return next
    }),
})

export const makeRequestRepositoryLayer = (env: Env) =>
  Layer.succeed(RequestRepository, makeLiveRequestRepository(env))
