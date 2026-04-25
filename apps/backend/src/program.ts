import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform"
import { Effect, Queue, Stream, Schedule, Schema } from "effect"

import { AuthProvider } from "./ports/AuthProvider"
import { CareRequests } from "./ports/CareRequests"
import { RequestCommands } from "./ports/RequestCommands"
import { SseRegistry } from "./ports/SseRegistry"
import { RequestId, Money, UserId } from "./data/branded"
import { Unauthorized } from "./data/errors"

const sseEncoder = new TextEncoder()
const toSseChunk = (payload: string) => sseEncoder.encode(`data: ${payload}\n\n`)
const heartbeatChunk = sseEncoder.encode(": keep-alive\n\n")

// Health check - no auth required
const healthHandler = Effect.succeed(HttpServerResponse.text("ok"))

// Helper middleware to extract auth token
const withAuth = <R, E, A>(
  handler: (identity: { userId: UserId; firebaseUid: string; email: string; roles: ReadonlyArray<"patient" | "provider"> }) => Effect.Effect<A, E, R>
): Effect.Effect<A, E | Unauthorized, R | AuthProvider | HttpServerRequest.HttpServerRequest> =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest
    const authHeader = request.headers["authorization"]
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return yield* new Unauthorized({ message: "Missing or invalid authorization header" })
    }
    const token = authHeader.slice(7)
    const authProvider = yield* AuthProvider
    const identity = yield* authProvider.verifyToken(token)
    return yield* handler({ ...identity, userId: identity.userId as UserId })
  })

// Helper to get request ID from URL
const getRequestId = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const url = new URL(request.url, `http://localhost`)
  const parts = url.pathname.split("/")
  return parts[3] as RequestId
})

// List requests
const listRequestsHandler = withAuth((identity) =>
  Effect.gen(function* () {
    const requests = yield* CareRequests
    const items = yield* requests.findByPatient(identity.userId)
    return { items }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// Create request
const createRequestHandler = withAuth((identity) =>
  Effect.gen(function* () {
    const commands = yield* RequestCommands
    const request = yield* HttpServerRequest.HttpServerRequest
    const body = yield* request.json as Effect.Effect<{ title: string; description: string; category: string }>
    const created = yield* commands.create(body, identity.userId)
    return { request: created }
  }).pipe(
    Effect.flatMap((data) => HttpServerResponse.json(data, { status: 201 }))
  )
)

// Open request
const openRequestHandler = withAuth((identity) =>
  Effect.gen(function* () {
    const commands = yield* RequestCommands
    const requestId = yield* getRequestId
    const opened = yield* commands.open(requestId, identity.userId)
    return { request: opened }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// Get room snapshot
const getRoomHandler = withAuth(() =>
  Effect.gen(function* () {
    const requests = yield* CareRequests
    const requestId = yield* getRequestId
    const request = yield* requests.findById(requestId)
    return { request }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// SSE stream
const streamHandler = withAuth(() =>
  Effect.gen(function* () {
    const requestId = yield* getRequestId
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
)

// Place bid
const placeBidHandler = withAuth((identity) =>
  Effect.gen(function* () {
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
    return { bid }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// Build router
export const router = HttpRouter.empty.pipe(
  HttpRouter.get("/health", healthHandler),
  HttpRouter.get("/api/requests", listRequestsHandler),
  HttpRouter.post("/api/requests", createRequestHandler),
  HttpRouter.post("/api/requests/:id/open", openRequestHandler),
  HttpRouter.get("/api/requests/:id/room", getRoomHandler),
  HttpRouter.get("/api/requests/:id/stream", streamHandler),
  HttpRouter.post("/api/requests/:id/bids", placeBidHandler)
)
