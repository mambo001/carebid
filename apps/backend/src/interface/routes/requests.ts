import express from "express"
import { Effect, Either } from "effect"
import * as Schema from "@effect/schema/Schema"

import type { AppConfig } from "../../shared/config/runtime-env"
import { runEffect, sendErrorResponse } from "../../app"
import { placeBidCommand } from "../../application/commands/room/place-bid"
import { withdrawBidCommand } from "../../application/commands/room/withdraw-bid"
import { acceptBidCommand } from "../../application/commands/room/accept-bid"
import { expireRoomCommand } from "../../application/commands/room/expire-room"
import { createRequest } from "../../application/commands/create-request"
import { openRequest } from "../../application/commands/open-request"
import { getRoomSnapshotQuery } from "../../application/queries/room/get-room-snapshot"
import { getRequest } from "../../application/queries/get-request"
import { listRequests } from "../../application/queries/list-requests"
import { RoomNotifier } from "../../domain/ports/room-notifier"
import {
  AcceptBidInputSchema,
  BidInputSchema,
  BidMutationResponseSchema,
  CreateCareRequestInputSchema,
  CreateCareRequestResponseSchema,
  RequestListResponseSchema,
  RequestResolutionResponseSchema,
  RequestRoomSnapshotSchema,
  RequestSummaryResponseSchema,
  WithdrawBidInputSchema,
  providerCategories,
} from "@carebid/shared"
import type { AuthenticatedRequest } from "../middleware/auth"

const decodeCreateCareRequestInput = Schema.decodeUnknownEither(CreateCareRequestInputSchema)
const decodeRequestListResponse = Schema.decodeUnknownSync(RequestListResponseSchema)
const decodeCreateCareRequestResponse = Schema.decodeUnknownSync(CreateCareRequestResponseSchema)
const decodeRequestSummaryResponse = Schema.decodeUnknownSync(RequestSummaryResponseSchema)
const decodeRequestRoomSnapshot = Schema.decodeUnknownSync(RequestRoomSnapshotSchema)
const decodeBidInput = Schema.decodeUnknownSync(BidInputSchema)
const decodeWithdrawBidInput = Schema.decodeUnknownSync(WithdrawBidInputSchema)
const decodeAcceptBidInput = Schema.decodeUnknownSync(AcceptBidInputSchema)
const decodeBidMutationResponse = Schema.decodeUnknownSync(BidMutationResponseSchema)
const decodeResolutionResponse = Schema.decodeUnknownSync(RequestResolutionResponseSchema)

export const createRequestRoutes = (config: AppConfig) => {
  const router = express.Router()
  const getRequestId = (value: string | Array<string> | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : (value ?? "")

  router.get("/requests", async (_req, res) => {
    try {
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const items = yield* listRequests()
          return decodeRequestListResponse({ items, filters: providerCategories })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/requests/validate", (req, res) => {
    const decoded = decodeCreateCareRequestInput(req.body)
    if (Either.isLeft(decoded)) {
      return res.status(400).json({ ok: false, error: "Invalid request payload", issue: decoded.left })
    }

    res.json({ ok: true, item: decoded.right })
  })

  router.post("/requests", async (req: AuthenticatedRequest, res) => {
    const decoded = decodeCreateCareRequestInput(req.body)
    if (Either.isLeft(decoded)) {
      return res.status(400).json({ ok: false, error: "Invalid request payload", issue: decoded.left })
    }

    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const item = yield* createRequest(identity, decoded.right)
          return decodeCreateCareRequestResponse({ ok: true, item })
        }),
      )

      res.status(201).json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/requests/:requestId/open", async (req, res) => {
    try {
      const requestId = req.params.requestId
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const notifier = yield* RoomNotifier
          const item = yield* openRequest(getRequestId(requestId))
          yield* notifier.notifyRoomUpdated(getRequestId(requestId))
          return decodeRequestSummaryResponse({ ok: true, item })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.get("/requests/:requestId/room", async (req, res) => {
    try {
      const requestId = getRequestId(req.params.requestId)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          yield* getRequest(requestId)
          const snapshot = yield* getRoomSnapshotQuery(requestId)
          return decodeRequestRoomSnapshot({
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
          })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/requests/:requestId/bids", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const input = decodeBidInput(req.body)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const snapshot = yield* placeBidCommand(identity, input)
          return decodeBidMutationResponse({
            ok: true,
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
          })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/requests/:requestId/bids/withdraw", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const input = decodeWithdrawBidInput(req.body)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const snapshot = yield* withdrawBidCommand(identity, input)
          return decodeBidMutationResponse({
            ok: true,
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
          })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/requests/:requestId/bids/accept", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const input = decodeAcceptBidInput(req.body)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const snapshot = yield* acceptBidCommand(identity, input)
          return decodeResolutionResponse({
            ok: true,
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
          })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  router.post("/requests/:requestId/expire", async (req: AuthenticatedRequest, res) => {
    try {
      const identity = { authUserId: req.authUserId!, email: req.authEmail! }
      const requestId = getRequestId(req.params.requestId)
      const payload = await runEffect(
        config,
        Effect.gen(function* () {
          const snapshot = yield* expireRoomCommand(identity, requestId)
          return decodeResolutionResponse({
            ok: true,
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
          })
        }),
      )

      res.json(payload)
    } catch (error) {
      sendErrorResponse(error, res)
    }
  })

  return router
}
