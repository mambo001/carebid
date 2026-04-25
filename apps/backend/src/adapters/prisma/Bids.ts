import { Effect, Layer, ParseResult } from "effect"
import { Bids } from "../../ports/Bids"
import { BidId, RequestId, UserId } from "../../data/branded"
import { Bid } from "../../data/entities"
import { BidNotFound, DatabaseError } from "../../data/errors"
import { decodeBid, encodeBid, PrismaBid } from "./lib/codecs"
import { makePrismaClient } from "./lib/prisma-client"

// Helper to convert parse/DB errors into defects since Bids port doesn't expose them
const handleDbError = (error: DatabaseError | ParseResult.ParseError): Effect.Effect<never> =>
  Effect.die(error)

export const make = Effect.gen(function* () {
  const prisma = yield* makePrismaClient

  const findById = (id: BidId): Effect.Effect<Bid, BidNotFound> =>
    Effect.gen(function* () {
      const row = yield* Effect.tryPromise<PrismaBid | null, DatabaseError>({
        try: () =>
          prisma.bid.findUnique({
            where: { id },
            include: { provider: true },
          }) as Promise<PrismaBid | null>,
        catch: (error) => new DatabaseError({ cause: error }),
      })

      if (row === null) {
        return yield* Effect.fail(new BidNotFound({ bidId: id }))
      }

      return yield* decodeBid(row)
    }).pipe(
      Effect.catchAll((error) =>
        error instanceof BidNotFound
          ? Effect.fail(error)
          : handleDbError(error)
      )
    )

  const findByRequest = (requestId: RequestId): Effect.Effect<ReadonlyArray<Bid>> =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise<PrismaBid[], DatabaseError>({
        try: () =>
          prisma.bid.findMany({
            where: { careRequestId: requestId },
            include: { provider: true },
            orderBy: { createdAt: "desc" },
          }) as Promise<PrismaBid[]>,
        catch: (error) => new DatabaseError({ cause: error }),
      })

      return yield* Effect.all(
        rows.map((row) => decodeBid(row)),
        { concurrency: "unbounded" }
      )
    }).pipe(Effect.orDie)

  const findByProvider = (providerId: UserId): Effect.Effect<ReadonlyArray<Bid>> =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise<PrismaBid[], DatabaseError>({
        try: () =>
          prisma.bid.findMany({
            where: { providerId },
            include: { provider: true },
            orderBy: { createdAt: "desc" },
          }) as Promise<PrismaBid[]>,
        catch: (error) => new DatabaseError({ cause: error }),
      })

      return yield* Effect.all(
        rows.map((row) => decodeBid(row)),
        { concurrency: "unbounded" }
      )
    }).pipe(Effect.orDie)

  const save = (bid: Bid): Effect.Effect<void> =>
    Effect.gen(function* () {
      const encoded = encodeBid(bid)

      yield* Effect.tryPromise({
        try: () =>
          prisma.bid.upsert({
            where: { id: bid.id },
            create: encoded as unknown as { [key: string]: unknown },
            update: {
              amount: encoded.amount,
              availableDate: encoded.availableDate,
              notes: encoded.notes,
              status: encoded.status,
              updatedAt: new Date(),
            },
          }),
        catch: (error) => new DatabaseError({ cause: error }),
      })
    }).pipe(Effect.orDie)

  return Bids.of({ findById, findByRequest, findByProvider, save })
})

export const layer = Layer.effect(Bids, make)
