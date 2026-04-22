import Redis from "ioredis"
import { Effect, Ref } from "effect"

import type { AppConfig } from "../../shared/config/runtime-env"
import { createPrismaClient } from "../../lib/db"
import { RoomSnapshotMessageSchema } from "@carebid/shared"
import * as Schema from "@effect/schema/Schema"
import { SseRegistry } from "../../domain/ports/sse-registry"

const decodeMessage = Schema.decodeUnknownSync(RoomSnapshotMessageSchema)

const loadSnapshot = (databaseUrl: string, requestId: string) =>
  Effect.tryPromise({
    try: async () => {
      const prisma = createPrismaClient(databaseUrl)
      const request = await prisma.careRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          status: true,
          awardedBidId: true,
          bids: {
            where: { status: { in: ["active", "accepted"] } },
            orderBy: [{ amount: "asc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              providerId: true,
              amount: true,
              availableDate: true,
              notes: true,
              provider: { select: { displayName: true } },
            },
          },
        },
      })
      if (!request) return null
      return decodeMessage({
        type: "snapshot",
        snapshot: {
          requestId: request.id,
          status: request.status,
          awardedBidId: request.awardedBidId ?? undefined,
          connectedViewers: 0,
          leaderboard: request.bids.map((bid) => ({
            bidId: bid.id,
            providerId: bid.providerId,
            providerDisplayName: bid.provider.displayName,
            amount: bid.amount,
            availableDate: bid.availableDate.toISOString(),
            notes: bid.notes ?? undefined,
          })),
        },
      })
    },
    catch: () => null,
  }).pipe(Effect.mapError(() => null as never))

export const publishSnapshot = (
  registry: {
    hasSubscribers: (requestId: string) => Effect.Effect<boolean>
    broadcast: (requestId: string, payload: string) => Effect.Effect<void>
  },
  loadMessage: Effect.Effect<string | null>,
  requestId: string,
) =>
  registry.hasSubscribers(requestId).pipe(
    Effect.flatMap((hasSubscribers) =>
      hasSubscribers
        ? loadMessage.pipe(
            Effect.flatMap((message) =>
              message ? registry.broadcast(requestId, message) : Effect.void,
            ),
          )
        : Effect.void,
    ),
  )

type SseRegistryRuntime = {
  hasSubscribers: (requestId: string) => Effect.Effect<boolean>
  broadcast: (requestId: string, payload: string) => Effect.Effect<void>
}

export const startRedisRoomSubscriber = (config: AppConfig, registry: SseRegistryRuntime) =>
  Effect.gen(function* () {
    const started = yield* Ref.make(false)
    const alreadyStarted = yield* Ref.get(started)
    if (alreadyStarted || !config.redisUrl || !config.databaseUrl) {
      return
    }
    yield* Ref.set(started, true)
    const subscriber = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
    yield* Effect.promise(() => subscriber.connect())
    yield* Effect.promise(() => subscriber.psubscribe("room:*"))
    subscriber.on("pmessage", (_pattern, channel) => {
      const requestId = channel.slice("room:".length)
      void Effect.runPromise(
        publishSnapshot(
          registry,
          loadSnapshot(config.databaseUrl!, requestId).pipe(Effect.map((message) => (message ? JSON.stringify(message) : null))),
          requestId,
        ),
      )
    })
  })
