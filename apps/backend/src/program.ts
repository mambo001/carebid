import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform"
import { Effect, Queue, Stream, Schedule, Schema } from "effect"

import { AuthProvider } from "./ports/AuthProvider"
import { CareRequests } from "./ports/CareRequests"
import { RequestCommands } from "./ports/RequestCommands"
import { SseRegistry } from "./ports/SseRegistry"
import { RequestId, Money } from "./data/branded"
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
  return id as RequestId
})

// Handler functions (not Effect values)
const healthHandler = () => Effect.succeed(HttpServerResponse.text("ok"))

const listRequestsHandler = () => Effect.gen(function* () {
  const identity = yield* authenticate
  const requests = yield* CareRequests
  const items = yield* requests.findByPatient(identity.userId)
  return HttpServerResponse.json({ items })
})

const createRequestHandler = () => Effect.gen(function* () {
  const identity = yield* authenticate
  const commands = yield* RequestCommands
  const request = yield* HttpServerRequest.HttpServerRequest
  const body = yield* request.json as Effect.Effect<{ title: string; description: string; category: string }>
  const created = yield* commands.create(body, identity.userId)
  return HttpServerResponse.json({ request: created }, { status: 201 })
})

const openRequestHandler = () => Effect.gen(function* () {
  const identity = yield* authenticate
  const commands = yield* RequestCommands
  const requestId = yield* getRequestIdFromPath
  const opened = yield* commands.open(requestId, identity.userId)
  return HttpServerResponse.json({ request: opened })
})

const getRoomHandler = () => Effect.gen(function* () {
  yield* authenticate
  const requests = yield* CareRequests
  const requestId = yield* getRequestIdFromPath
  const request = yield* requests.findById(requestId)
  return HttpServerResponse.json({ request })
})

const streamHandler = () => Effect.gen(function* () {
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
})

const placeBidHandler = () => Effect.gen(function* () {
  const identity = yield* authenticate
  const commands = yield* RequestCommands
  const request = yield* HttpServerRequest.HttpServerRequest
  const body = yield* request.json as Effect.Effect<{ requestId: string; amount: number; availableDate: string; notes: string | null }>
  const amount = Schema.decodeUnknownSync(Money)(body.amount)
  const bid = yield* commands.placeBid({
    requestId: body.requestId as RequestId,
    amount: amount,
    availableDate: new Date(body.availableDate),
    notes: body.notes,
  }, identity.userId)
  return HttpServerResponse.json({ bid })
})

export const router = HttpRouter.empty.pipe(
  HttpRouter.get("/health", healthHandler),
  HttpRouter.get("/api/requests", listRequestsHandler),
  HttpRouter.post("/api/requests", createRequestHandler),
  HttpRouter.post("/api/requests/:id/open", openRequestHandler),
  HttpRouter.get("/api/requests/:id/room", getRoomHandler),
  HttpRouter.get("/api/requests/:id/stream", streamHandler),
  HttpRouter.post("/api/requests/:id/bids", placeBidHandler)
)
