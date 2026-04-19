import { Effect } from "effect"
import { Hono } from "hono"
import * as Schema from "@effect/schema/Schema"

import {
  AcceptBidInputSchema,
  BidInputSchema,
  BidMutationResponseSchema,
  RequestResolutionResponseSchema,
  WithdrawBidInputSchema,
} from "@carebid/shared"

import { acceptBidCommand } from "../../application/commands/room/accept-bid"
import { expireRoomCommand } from "../../application/commands/room/expire-room"
import { placeBidCommand } from "../../application/commands/room/place-bid"
import { syncRoomStatusCommand } from "../../application/commands/room/sync-room-status"
import { withdrawBidCommand } from "../../application/commands/room/withdraw-bid"
import { getRoomSnapshotQuery } from "../../application/queries/room/get-room-snapshot"
import { DatabaseError, RoomNotOpenError } from "../../domain/errors"
import { RoomGateway } from "../../domain/ports/room-gateway"
import type { RoomState } from "../../domain/entities"
import { createRoomSnapshot } from "../../domain/room"

type Provide = <Result, E>(effect: Effect.Effect<Result, E, RoomGateway>) => Effect.Effect<Result, E, never>

const decodeBidInput = Schema.decodeUnknownSync(BidInputSchema)
const decodeWithdrawBidInput = Schema.decodeUnknownSync(WithdrawBidInputSchema)
const decodeAcceptBidInput = Schema.decodeUnknownSync(AcceptBidInputSchema)
const decodeBidMutationResponse = Schema.decodeUnknownSync(BidMutationResponseSchema)
const decodeResolutionResponse = Schema.decodeUnknownSync(RequestResolutionResponseSchema)
const decodeStatusSyncBody = Schema.decodeUnknownSync(
  Schema.Struct({ status: Schema.Literal("draft", "open", "awarded", "expired") }),
)

const validStatuses = ["draft", "open", "awarded", "expired"] as const

const parseInitialStatus = (param: string | null): RoomState["status"] =>
  validStatuses.includes(param as RoomState["status"]) ? (param as RoomState["status"]) : "open"

const bidMutationResponse = (state: RoomState) =>
  Response.json(decodeBidMutationResponse({ ok: true, snapshot: createRoomSnapshot(state) }))

const resolutionResponse = (state: RoomState) =>
  Response.json(decodeResolutionResponse({ ok: true, snapshot: createRoomSnapshot(state) }))

const closedResponse = (state: RoomState) =>
  Response.json(
    { ok: false, error: "Request is no longer open", snapshot: createRoomSnapshot(state) },
    { status: 409 },
  )

const handleRoomErrors = (requestId: string) =>
  (effect: Effect.Effect<Response, RoomNotOpenError | DatabaseError, RoomGateway>): Effect.Effect<Response, never, RoomGateway> =>
    Effect.catchAll(effect, () =>
      Effect.gen(function* () {
        const state = yield* getRoomSnapshotQuery(requestId).pipe(
          Effect.catchAll(() => Effect.succeed(null)),
        )
        if (state) return closedResponse(state)
        return Response.json({ ok: false, error: "Room error" }, { status: 500 })
      }),
    )

export const createRoomRoutes = (provide: Provide) => {
  const run = (effect: Effect.Effect<Response, never, RoomGateway>) =>
    Effect.runPromise(provide(effect))

  const app = new Hono()

  app.get("/snapshot", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const initialStatus = parseInitialStatus(c.req.query("status") ?? null)
    const state = await Effect.runPromise(provide(getRoomSnapshotQuery(requestId, initialStatus)))
    return c.json(createRoomSnapshot(state))
  })

  app.post("/status/sync", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const { status } = decodeStatusSyncBody(await c.req.json())
    const state = await Effect.runPromise(provide(syncRoomStatusCommand(requestId, status)))
    return c.json(createRoomSnapshot(state))
  })

  app.post("/bids/place", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const input = decodeBidInput(await c.req.json())

    return run(
      Effect.gen(function* () {
        const state = yield* placeBidCommand(input)
        return bidMutationResponse(state)
      }).pipe(handleRoomErrors(requestId)),
    )
  })

  app.post("/bids/withdraw", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const input = decodeWithdrawBidInput(await c.req.json())

    return run(
      Effect.gen(function* () {
        const state = yield* withdrawBidCommand(input)
        return bidMutationResponse(state)
      }).pipe(handleRoomErrors(requestId)),
    )
  })

  app.post("/bids/accept", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const input = decodeAcceptBidInput(await c.req.json())

    return run(
      Effect.gen(function* () {
        const state = yield* acceptBidCommand(input)
        return resolutionResponse(state)
      }).pipe(handleRoomErrors(requestId)),
    )
  })

  app.post("/expire", async (c) => {
    const requestId = c.req.query("requestId") ?? ""

    return run(
      Effect.gen(function* () {
        const state = yield* expireRoomCommand(requestId)
        return resolutionResponse(state)
      }).pipe(handleRoomErrors(requestId)),
    )
  })

  return app
}
