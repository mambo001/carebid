import { Effect, Layer } from "effect"

import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

import { DatabaseError, RequestNotFoundError } from "../../domain/errors"
import { RequestRepository } from "../../domain/ports/request-repository"
import type { AuthIdentity } from "../../domain/ports/session-repository"
import { createPrismaClient } from "../../lib/db"

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

const query = <Result>(fn: () => Promise<Result>): Effect.Effect<Result, DatabaseError> =>
  Effect.tryPromise({
    try: fn,
    catch: (error) => new DatabaseError({ message: String(error) }),
  })

export const makePrismaRequestRepository = (databaseUrl: string): RequestRepository => {
  const prisma = createPrismaClient(databaseUrl)

  return {
    listRequests: () =>
      Effect.gen(function* () {
        const requests = yield* query(() =>
          prisma.careRequest.findMany({ orderBy: { createdAt: "desc" } }),
        )
        return requests.map(mapRequestSummary)
      }),

    getRequest: (requestId) =>
      Effect.gen(function* () {
        const request = yield* query(() =>
          prisma.careRequest.findUnique({ where: { id: requestId } }),
        )

        if (!request) {
          return yield* Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
        }

        return mapRequestSummary(request)
      }),

    createRequest: (identity: AuthIdentity, input: CreateCareRequestInput) =>
      Effect.gen(function* () {
        const patient = yield* query(() =>
          prisma.patient.upsert({
            where: { authUserId: identity.authUserId },
            update: {},
            create: {
              authUserId: identity.authUserId,
              email: identity.email,
              displayName: identity.email.split("@")[0],
              locationCity: input.locationCity,
              locationRegion: input.locationRegion,
            },
          }),
        )

        const request = yield* query(() =>
          prisma.careRequest.create({
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
          }),
        )

        return mapRequestSummary(request)
      }),

    openRequest: (requestId) =>
      query(() =>
        prisma.careRequest.update({ where: { id: requestId }, data: { status: "open" } }),
      ).pipe(
        Effect.map(mapRequestSummary),
        Effect.catchTag("DatabaseError", (e) =>
          Effect.fail(new RequestNotFoundError({ message: e.message })),
        ),
      ),

    markRequestAwarded: (requestId, bidId) =>
      query(() =>
        prisma.careRequest.update({
          where: { id: requestId },
          data: { status: "awarded", awardedBidId: bidId },
        }),
      ).pipe(
        Effect.map(mapRequestSummary),
        Effect.catchTag("DatabaseError", (e) =>
          Effect.fail(new RequestNotFoundError({ message: e.message })),
        ),
      ),

    markRequestExpired: (requestId) =>
      query(() =>
        prisma.careRequest.update({ where: { id: requestId }, data: { status: "expired" } }),
      ).pipe(
        Effect.map(mapRequestSummary),
        Effect.catchTag("DatabaseError", (e) =>
          Effect.fail(new RequestNotFoundError({ message: e.message })),
        ),
      ),
  }
}

export const makePrismaRequestRepositoryLayer = (databaseUrl: string) =>
  Layer.succeed(RequestRepository, makePrismaRequestRepository(databaseUrl))
