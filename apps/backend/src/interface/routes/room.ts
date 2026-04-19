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
import { RoomNotOpenError } from "../../domain/errors"
import { RoomGateway } from "../../domain/ports/room-gateway"
import type { RoomState } from "../../domain/entities"
import { createRoomSnapshot } from "../../infra/room/durable-object-room-gateway"

type Provide = <Result, E>(effect: Effect.Effect<Result, E, RoomGateway>) => Effect.Effect<Result, E, never>

const validStatuses = ["draft", "open", "awarded", "expired"] as const

const parseInitialStatus = (param: string | null): RoomState["status"] =>
  validStatuses.includes(param as RoomState["status"]) ? (param as RoomState["status"]) : "open"

const closedResponse = (state: RoomState) =>
  Response.json(
    { ok: false, error: "Request is no longer open", snapshot: createRoomSnapshot(state) },
    { status: 409 },
  )

const onRoomNotOpen = (requestId: string) =>
  Effect.gen(function* () {
    const state = yield* getRoomSnapshotQuery(requestId)
    return closedResponse(state)
  })

export const createRoomRoutes = (provide: Provide) => {
  const app = new Hono()

  app.get("/snapshot", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const initialStatus = parseInitialStatus(c.req.query("status") ?? null)
    const state = await Effect.runPromise(provide(getRoomSnapshotQuery(requestId, initialStatus)))
    return c.json(createRoomSnapshot(state))
  })

  app.post("/status/sync", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const body = Schema.decodeUnknownSync(
      Schema.Struct({ status: Schema.Literal("draft", "open", "awarded", "expired") }),
    )(await c.req.json())
    const state = await Effect.runPromise(provide(syncRoomStatusCommand(requestId, body.status)))
    return c.json(createRoomSnapshot(state))
  })

  app.post("/bids/place", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const input = Schema.decodeUnknownSync(BidInputSchema)(await c.req.json())
    const response = await Effect.runPromise(
      provide(
        placeBidCommand(input).pipe(
          Effect.map((state) =>
            Response.json(Schema.decodeUnknownSync(BidMutationResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) })),
          ),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        ),
      ),
    )
    return response
  })

  app.post("/bids/withdraw", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const input = Schema.decodeUnknownSync(WithdrawBidInputSchema)(await c.req.json())
    const response = await Effect.runPromise(
      provide(
        withdrawBidCommand(input).pipe(
          Effect.map((state) =>
            Response.json(Schema.decodeUnknownSync(BidMutationResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) })),
          ),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        ),
      ),
    )
    return response
  })

  app.post("/bids/accept", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const input = Schema.decodeUnknownSync(AcceptBidInputSchema)(await c.req.json())
    const response = await Effect.runPromise(
      provide(
        acceptBidCommand(input).pipe(
          Effect.map((state) =>
            Response.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) })),
          ),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        ),
      ),
    )
    return response
  })

  app.post("/expire", async (c) => {
    const requestId = c.req.query("requestId") ?? ""
    const response = await Effect.runPromise(
      provide(
        expireRoomCommand(requestId).pipe(
          Effect.map((state) =>
            Response.json(Schema.decodeUnknownSync(RequestResolutionResponseSchema)({ ok: true, snapshot: createRoomSnapshot(state) })),
          ),
          Effect.catchTag("RoomNotOpenError", () => onRoomNotOpen(requestId)),
        ),
      ),
    )
    return response
  })

  return app
}
