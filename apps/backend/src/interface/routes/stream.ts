import express from "express"
import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

import type { AppConfig } from "../../shared/config/runtime-env"
import { runEffect, sendErrorResponse } from "../../app"
import { getRoomSnapshotQuery } from "../../application/queries/room/get-room-snapshot"
import { getSseRegistry } from "../../infra/realtime/sse-registry"
import { RoomSnapshotMessageSchema } from "@carebid/shared"

const decodeMessage = Schema.decodeUnknownSync(RoomSnapshotMessageSchema)

export const createStreamRoutes = (config: AppConfig) => {
  const router = express.Router()

  router.get("/requests/:requestId/stream", async (req, res) => {
    try {
      const requestId = req.params.requestId
      const snapshot = await runEffect(config, getRoomSnapshotQuery(requestId))

      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache, no-transform")
      res.setHeader("Connection", "keep-alive")
      res.flushHeaders()

      const registry = getSseRegistry()
      const release = registry.add(requestId, res)
      res.write(`data: ${JSON.stringify(decodeMessage({
        type: "snapshot",
        snapshot: {
          requestId: snapshot.requestId,
          status: snapshot.status,
          awardedBidId: snapshot.awardedBidId,
          connectedViewers: snapshot.connectedViewers,
          leaderboard: snapshot.bids.map((bid) => ({
            bidId: bid.bidId,
            providerId: bid.providerId,
            providerDisplayName: bid.providerDisplayName,
            amount: bid.amount,
            availableDate: bid.availableDate,
            notes: bid.notes,
          })),
        },
      }))}\n\n`)

      req.on("close", () => {
        release()
        res.end()
      })
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  return router
}
