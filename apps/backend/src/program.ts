import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform"
import { Effect, Queue, Stream, Schedule } from "effect"
import * as Schema from "@effect/schema/Schema"

import { AuthProvider } from "./ports/AuthProvider"
import { CareRequests } from "./ports/CareRequests"
import { RequestCommands, CreateRequestInput, PlaceBidInput } from "./ports/RequestCommands"
import { SseRegistry } from "./ports/SseRegistry"
import { RequestId, BidId } from "./data/branded"
import { Unauthorized } from "./data/errors"

const sseEncoder = new TextEncoder()
const toSseChunk = (payload: string) => sseEncoder.encode(`data: ${payload}\n\n`)
const heartbeatChunk = sseEncoder.encode(": keep-alive\n\n")

const authenticate = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const authHeader = request.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return yield* new Unauthorized({ message: "Missing or invalid authorization header" })
  }

  const token = authHeader.slice(7)
  const authProvider = yield* AuthProvider
  return yield* authProvider.verifyToken(token)
})

const getRequestIdFromPath = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const url = new URL(request.url, `http://localhost`)
  const parts = url.pathname.split("/")
  const id = parts[3] // /api/requests/:id/...
  return RequestId.makeUnsafe(id)
})

export const router = HttpRouter.empty.pipe(
  // Health check
  HttpRouter.get("/health", Effect.succeed(HttpServerResponse.text("ok"))),

  // List requests
  HttpRouter.get("/api/requests", Effect.gen(function* () {
    const identity = yield* authenticate
    const requests = yield* CareRequests
    const items = yield* requests.findByPatient(identity.userId)
    return HttpServerResponse.json({ items })
  })),

  // Create request
  HttpRouter.post("/api/requests", Effect.gen(function* () {
    const identity = yield* authenticate
    const commands = yield* RequestCommands
    const request = yield* HttpServerRequest.HttpServerRequest
    const body = yield* request.json
    const input = yield* Schema.decodeUnknownEffect(CreateRequestInput)(body)
    const created = yield* commands.create(input, identity.userId)
    return HttpServerResponse.json({ request: created }, { status: 201 })
  })),

  // Open request
  HttpRouter.post("/api/requests/:id/open", Effect.gen(function* () {
    const identity = yield* authenticate
    const commands = yield* RequestCommands
    const requestId = yield* getRequestIdFromPath
    const opened = yield* commands.open(requestId, identity.userId)
    return HttpServerResponse.json({ request: opened })
  })),

  // Get room snapshot
  HttpRouter.get("/api/requests/:id/room", Effect.gen(function* () {
    yield* authenticate
    const requests = yield* CareRequests
    const requestId = yield* getRequestIdFromPath
    const request = yield* requests.findById(requestId)
    return HttpServerResponse.json({ request })
  })),

  // SSE stream
  HttpRouter.get("/api/requests/:id/stream", Effect.gen(function* () {
    yield* authenticate
    const requestId = yield* getRequestIdFromPath
    const registry = yield* SseRegistry
    const queue = yield* Queue.unbounded<string>()
    const release = yield* registry.add(requestId, queue)

    const updates = Stream.fromQueue(queue).pipe(Stream.map(toSseChunk))
    const heartbeat = Stream.repeatValue(heartbeatChunk).pipe(
      Stream.schedule(Schedule.spaced("25 seconds"))
    )
    const body = Stream.concat(
      Stream.make(toSseChunk(JSON.stringify({ type: "connected" }))),
      Stream.merge(updates, heartbeat)
    ).pipe(Stream.ensuring(release))

    return HttpServerResponse.stream(body, {
      contentType: "text/event-stream",
      headers: { "cache-control": "no-cache" },
    })
  })),

  // Place bid
  HttpRouter.post("/api/requests/:id/bids", Effect.gen(function* () {
    const identity = yield* authenticate
    const commands = yield* RequestCommands
    const request = yield* HttpServerRequest.HttpServerRequest
    const body = yield* request.json
    const input = yield* Schema.decodeUnknownEffect(PlaceBidInput)(body)
    const bid = yield* commands.placeBid(input, identity.userId)
    return HttpServerResponse.json({ bid })
  }))
)
