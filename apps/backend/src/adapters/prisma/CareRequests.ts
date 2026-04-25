import { Effect, Layer } from "effect"
import { CareRequests } from "../../ports/CareRequests"
import { RequestId, UserId } from "../../data/branded"
import { CareRequest } from "../../data/entities"
import { RequestNotFound, DatabaseError } from "../../data/errors"
import { decodeCareRequest, encodeCareRequest, PrismaCareRequest } from "./lib/codecs"
import { makePrismaClient } from "./lib/prisma-client"

export const make = Effect.gen(function* () {
  const prisma = yield* makePrismaClient

  const findById = (id: RequestId): Effect.Effect<CareRequest, RequestNotFound | DatabaseError> =>
    Effect.gen(function* () {
      const row = yield* Effect.tryPromise<PrismaCareRequest | null, DatabaseError>({
        try: () =>
          prisma.careRequest.findUnique({
            where: { id },
            include: { bids: true },
          }) as Promise<PrismaCareRequest | null>,
        catch: (error) => new DatabaseError({ cause: error }),
      })

      if (row === null) {
        return yield* Effect.fail(new RequestNotFound({ requestId: id }))
      }

      return yield* decodeCareRequest(row).pipe(
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )
    })

  const findByPatient = (patientId: UserId): Effect.Effect<ReadonlyArray<CareRequest>, DatabaseError> =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise<PrismaCareRequest[], DatabaseError>({
        try: () =>
          prisma.careRequest.findMany({
            where: { patientId },
            include: { bids: true },
          }) as Promise<PrismaCareRequest[]>,
        catch: (error) => new DatabaseError({ cause: error }),
      })

      return yield* Effect.all(
        rows.map((row) => decodeCareRequest(row)),
        { concurrency: "unbounded" }
      ).pipe(
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )
    })

  const findOpen = (): Effect.Effect<ReadonlyArray<CareRequest>, DatabaseError> =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise<PrismaCareRequest[], DatabaseError>({
        try: () =>
          prisma.careRequest.findMany({
            where: { status: "open" },
            include: { bids: true },
          }) as Promise<PrismaCareRequest[]>,
        catch: (error) => new DatabaseError({ cause: error }),
      })

      return yield* Effect.all(
        rows.map((row) => decodeCareRequest(row)),
        { concurrency: "unbounded" }
      ).pipe(
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )
    })

  const save = (request: CareRequest): Effect.Effect<void, DatabaseError> =>
    Effect.gen(function* () {
      const encoded = encodeCareRequest(request)

      yield* Effect.tryPromise({
        try: () =>
          prisma.careRequest.upsert({
            where: { id: request.id },
            create: encoded as unknown as { [key: string]: unknown },
            update: encoded as unknown as { [key: string]: unknown },
          }),
        catch: (error) => new DatabaseError({ cause: error }),
      })
    })

  return CareRequests.of({ findById, findByPatient, findOpen, save })
})

export const layer = Layer.effect(CareRequests, make)
