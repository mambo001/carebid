import Redis from "ioredis"

import type { AppConfig } from "../../shared/config/runtime-env"
import { createPrismaClient } from "../../lib/db"
import { getSseRegistry } from "./sse-registry"
import { RoomSnapshotMessageSchema } from "@carebid/shared"
import * as Schema from "@effect/schema/Schema"

const decodeMessage = Schema.decodeUnknownSync(RoomSnapshotMessageSchema)

const loadSnapshot = async (databaseUrl: string, requestId: string) => {
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

  if (!request) {
    return null
  }

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
}

let started = false

export const startRedisRoomSubscriber = (config: AppConfig) => {
  if (started || !config.redisUrl || !config.databaseUrl) {
    return
  }

  started = true
  const subscriber = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
  const registry = getSseRegistry()

  void subscriber.connect().then(async () => {
    await subscriber.psubscribe("room:*")
  })

  subscriber.on("pmessage", async (_pattern, channel) => {
    const requestId = channel.slice("room:".length)
    if (!registry.hasSubscribers(requestId)) {
      return
    }

    const message = await loadSnapshot(config.databaseUrl, requestId)
    if (!message) {
      return
    }

    registry.broadcast(requestId, JSON.stringify(message))
  })
}
