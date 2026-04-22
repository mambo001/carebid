import { HttpRouter, HttpServerResponse } from "@effect/platform"
import { Effect, Queue, Schedule, Stream } from "effect"
import * as Schema from "@effect/schema/Schema"

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
  RoomSnapshotMessageSchema,
  WithdrawBidInputSchema,
  providerCategories,
} from "@carebid/shared"

import { acceptBidCommand } from "../application/commands/room/accept-bid"
import { expireRoomCommand } from "../application/commands/room/expire-room"
import { placeBidCommand } from "../application/commands/room/place-bid"
import { withdrawBidCommand } from "../application/commands/room/withdraw-bid"
import { createRequest } from "../application/commands/create-request"
import { openRequest } from "../application/commands/open-request"
import { getRequest } from "../application/queries/get-request"
import { listRequests } from "../application/queries/list-requests"
import { getRoomSnapshotQuery } from "../application/queries/room/get-room-snapshot"
import { RoomNotifier } from "../domain/ports/room-notifier"
import { SseRegistry } from "../domain/ports/sse-registry"
import { authenticate, decodeBody, getRequestId, json, toRoomSnapshot } from "./common"

const decodeRequestListResponse = Schema.decodeUnknownSync(RequestListResponseSchema)
const decodeCreateCareRequestResponse = Schema.decodeUnknownSync(CreateCareRequestResponseSchema)
const decodeRequestSummaryResponse = Schema.decodeUnknownSync(RequestSummaryResponseSchema)
const decodeRequestRoomSnapshot = Schema.decodeUnknownSync(RequestRoomSnapshotSchema)
const decodeBidMutationResponse = Schema.decodeUnknownSync(BidMutationResponseSchema)
const decodeResolutionResponse = Schema.decodeUnknownSync(RequestResolutionResponseSchema)
const decodeRoomMessage = Schema.decodeUnknownSync(RoomSnapshotMessageSchema)

const sseEncoder = new TextEncoder()
const toSseChunk = (payload: string) => sseEncoder.encode(`data: ${payload}\n\n`)
const heartbeatChunk = sseEncoder.encode(": keep-alive\n\n")

export const requestRouter = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/api/requests",
    Effect.gen(function* () {
      yield* authenticate()
      const items = yield* listRequests()
      return json(decodeRequestListResponse({ items, filters: providerCategories }))
    }),
  ),
  HttpRouter.post(
    "/api/requests/validate",
    Effect.gen(function* () {
      yield* authenticate()
      const item = yield* decodeBody(CreateCareRequestInputSchema, "Invalid request payload")
      return json({ ok: true, item })
    }),
  ),
  HttpRouter.post(
    "/api/requests",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const input = yield* decodeBody(CreateCareRequestInputSchema, "Invalid request payload")
      const item = yield* createRequest(identity, input)
      return json(decodeCreateCareRequestResponse({ ok: true, item }), 201)
    }),
  ),
  HttpRouter.post(
    "/api/requests/:requestId/open",
    Effect.gen(function* () {
      yield* authenticate()
      const requestId = yield* getRequestId
      const notifier = yield* RoomNotifier
      const item = yield* openRequest(requestId)
      yield* notifier.notifyRoomUpdated(requestId)
      return json(decodeRequestSummaryResponse({ ok: true, item }))
    }),
  ),
  HttpRouter.get(
    "/api/requests/:requestId/room",
    Effect.gen(function* () {
      yield* authenticate()
      const requestId = yield* getRequestId
      yield* getRequest(requestId)
      const snapshot = yield* getRoomSnapshotQuery(requestId)
      return json(decodeRequestRoomSnapshot(toRoomSnapshot(snapshot)))
    }),
  ),
  HttpRouter.post(
    "/api/requests/:requestId/bids",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const input = yield* decodeBody(BidInputSchema, "Invalid bid payload")
      const snapshot = yield* placeBidCommand(identity, input)
      return json(decodeBidMutationResponse({ ok: true, snapshot: toRoomSnapshot(snapshot) }))
    }),
  ),
  HttpRouter.post(
    "/api/requests/:requestId/bids/withdraw",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const input = yield* decodeBody(WithdrawBidInputSchema, "Invalid withdraw payload")
      const snapshot = yield* withdrawBidCommand(identity, input)
      return json(decodeBidMutationResponse({ ok: true, snapshot: toRoomSnapshot(snapshot) }))
    }),
  ),
  HttpRouter.post(
    "/api/requests/:requestId/bids/accept",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const input = yield* decodeBody(AcceptBidInputSchema, "Invalid accept payload")
      const snapshot = yield* acceptBidCommand(identity, input)
      return json(decodeResolutionResponse({ ok: true, snapshot: toRoomSnapshot(snapshot) }))
    }),
  ),
  HttpRouter.post(
    "/api/requests/:requestId/expire",
    Effect.gen(function* () {
      const identity = yield* authenticate()
      const requestId = yield* getRequestId
      const snapshot = yield* expireRoomCommand(identity, requestId)
      return json(decodeResolutionResponse({ ok: true, snapshot: toRoomSnapshot(snapshot) }))
    }),
  ),
  HttpRouter.get(
    "/api/requests/:requestId/stream",
    Effect.gen(function* () {
      yield* authenticate(true)
      const requestId = yield* getRequestId
      const snapshot = yield* getRoomSnapshotQuery(requestId)
      const initialPayload = JSON.stringify(decodeRoomMessage({ type: "snapshot", snapshot: toRoomSnapshot(snapshot) }))
      const queue = yield* Queue.unbounded<string>()
      const registry = yield* SseRegistry
      const release = yield* registry.add(requestId, queue)

      const updates = Stream.fromQueue(queue).pipe(Stream.map(toSseChunk))
      const heartbeat = Stream.repeatValue(heartbeatChunk).pipe(Stream.schedule(Schedule.spaced("25 seconds")))
      const body = Stream.concat(Stream.make(toSseChunk(initialPayload)), Stream.merge(updates, heartbeat)).pipe(
        Stream.ensuring(release),
      )

      return HttpServerResponse.stream(body, {
        contentType: "text/event-stream",
        headers: {
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        },
      })
    }),
  ),
)
