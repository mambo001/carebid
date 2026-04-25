import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform"
import { Effect, Queue, Stream, Schedule, Schema } from "effect"

import { AuthProvider } from "./ports/AuthProvider"
import { CareRequests } from "./ports/CareRequests"
import { RequestCommands } from "./ports/RequestCommands"
import { SseRegistry } from "./ports/SseRegistry"
import { RequestId, Money, UserId } from "./data/branded"
import { Unauthorized } from "./data/errors"
import { authenticateRequest } from "./integration/auth"
import { parseRequestIdFromPath } from "./integration/path"

const sseEncoder = new TextEncoder()
const toSseChunk = (payload: string) => sseEncoder.encode(`data: ${payload}\n\n`)
const heartbeatChunk = sseEncoder.encode(": keep-alive\n\n")

// Authenticate middleware - extracts and verifies auth token
const withAuth = <R, E, A>(
  handler: (identity: { userId: UserId; firebaseUid: string; email: string; roles: ReadonlyArray<"patient" | "provider"> }) => Effect.Effect<A, E, R>
): Effect.Effect<A, E | Unauthorized, R | AuthProvider | HttpServerRequest.HttpServerRequest> =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest
    const identity = yield* authenticateRequest(request.headers["authorization"])
    return yield* handler({ ...identity, userId: identity.userId as UserId })
  })

// Extract request ID from current request path
const getRequestId = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const url = new URL(request.url, `http://localhost`)
  return parseRequestIdFromPath(url.pathname)
})

// Handler for GET /health
const healthHandler = Effect.succeed(HttpServerResponse.text("ok"))

// Handler for GET /api/requests
const listRequestsHandler = withAuth((identity) =>
  Effect.gen(function* () {
    const requests = yield* CareRequests
    const items = yield* requests.findByPatient(identity.userId)
    return { items }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// Handler for POST /api/requests
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

// Handler for POST /api/requests/:id/open
const openRequestHandler = withAuth((identity) =>
  Effect.gen(function* () {
    const commands = yield* RequestCommands
    const requestId = yield* getRequestId
    const opened = yield* commands.open(requestId, identity.userId)
    return { request: opened }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// Handler for GET /api/requests/:id/room
const getRoomHandler = withAuth(() =>
  Effect.gen(function* () {
    const requests = yield* CareRequests
    const requestId = yield* getRequestId
    const request = yield* requests.findById(requestId)
    return { request }
  }).pipe(Effect.flatMap((data) => HttpServerResponse.json(data)))
)

// Handler for GET /api/requests/:id/stream
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

// Handler for POST /api/requests/:id/bids
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
