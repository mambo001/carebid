import { HttpRouter, HttpServerError, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import { Data, Effect, Either, Schema as EffectSchema } from "effect"
import * as Schema from "@effect/schema/Schema"

import { AuthError, BidNotFoundError, DatabaseError, RequestNotFoundError, RoomNotOpenError, SessionError } from "../domain/errors"
import { AuthProvider } from "../domain/ports/auth-provider"

export class BadRequestError extends Data.TaggedError("BadRequestError")<{
  message: string
  issue?: unknown
}> {}

const RequestIdParamsSchema = EffectSchema.Struct({
  requestId: EffectSchema.String,
})

const AuthHeadersSchema = EffectSchema.Struct({
  authorization: EffectSchema.optional(EffectSchema.String),
})

const TokenQuerySchema = EffectSchema.Struct({
  token: EffectSchema.optional(EffectSchema.String),
})

export const json = (body: unknown, status = 200) => HttpServerResponse.unsafeJson(body, { status })

export const errorResponse = (error: unknown) => {
  if (error instanceof BadRequestError) {
    return json({ ok: false, error: error.message, ...(error.issue !== undefined ? { issue: error.issue } : {}) }, 400)
  }

  if (error instanceof AuthError) {
    return json({ ok: false, error: error.message ?? "Invalid or expired session" }, 401)
  }

  if (error instanceof RequestNotFoundError) {
    return json({ ok: false, error: error.message ?? "Request not found" }, 404)
  }

  if (error instanceof SessionError || error instanceof RoomNotOpenError || error instanceof BidNotFoundError) {
    return json({ ok: false, error: error.message ?? "Request conflict" }, 409)
  }

  if (error instanceof DatabaseError) {
    return json({ ok: false, error: error.message ?? "Unexpected backend error" }, 500)
  }

  if (error instanceof HttpServerError.RequestError) {
    return json({ ok: false, error: error.message }, error.reason === "Decode" ? 400 : 500)
  }

  return json({ ok: false, error: "Unexpected backend error" }, 500)
}

export const decodeBody = <A, I>(schema: Schema.Schema<A, I>, message: string) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest
    const webRequest = yield* HttpServerRequest.toWeb(request)
    const raw = yield* Effect.tryPromise({
      try: () => webRequest.json(),
      catch: (cause) => new BadRequestError({ message, issue: cause }),
    })

    const decoded = Schema.decodeUnknownEither(schema)(raw)
    if (Either.isLeft(decoded)) {
      return yield* Effect.fail(new BadRequestError({ message, issue: decoded.left }))
    }

    return decoded.right
  })

export const getRequestId = Effect.gen(function* () {
  const decoded = yield* HttpRouter.schemaPathParams(RequestIdParamsSchema).pipe(
    Effect.mapError((issue) => new BadRequestError({ message: "Missing requestId path parameter", issue })),
  )

  return decoded.requestId
})

const getAuthToken = (allowQueryToken: boolean) =>
  Effect.gen(function* () {
    const { authorization } = yield* HttpServerRequest.schemaHeaders(AuthHeadersSchema).pipe(
      Effect.mapError((issue) => new BadRequestError({ message: "Invalid request headers", issue })),
    )

    if (authorization?.startsWith("Bearer ")) {
      return authorization.slice(7)
    }

    if (allowQueryToken) {
      const { token } = yield* HttpServerRequest.schemaSearchParams(TokenQuerySchema).pipe(
        Effect.mapError((issue) => new BadRequestError({ message: "Invalid query parameters", issue })),
      )

      if (token) {
        return token
      }
    }

    return yield* Effect.fail(new AuthError({ message: "Missing or invalid Authorization header" }))
  })

export const authenticate = (allowQueryToken = false) =>
  Effect.gen(function* () {
    const token = yield* getAuthToken(allowQueryToken)
    const authProvider = yield* AuthProvider
    const authUser = yield* authProvider.validateToken(token)
    return { authUserId: authUser.id, email: authUser.email }
  })

export const toRoomSnapshot = (snapshot: {
  requestId: string
  status: "draft" | "open" | "awarded" | "expired"
  awardedBidId?: string
  connectedViewers: number
  bids: ReadonlyArray<{
    bidId: string
    providerId: string
    providerDisplayName: string
    amount: number
    availableDate: string
    notes?: string
  }>
}) => ({
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
