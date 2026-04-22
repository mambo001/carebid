import { Context, Effect } from "effect"

import type { AcceptBidInput, BidInput, WithdrawBidInput } from "@carebid/shared"

import type { RoomState } from "../entities"
import { BidNotFoundError, DatabaseError, RequestNotFoundError, RoomNotOpenError } from "../errors"

export interface RoomRepository {
  readonly getRoomState: (
    requestId: string,
  ) => Effect.Effect<RoomState, DatabaseError | RequestNotFoundError>
  readonly placeBid: (
    actorAuthUserId: string,
    input: BidInput,
  ) => Effect.Effect<RoomState, DatabaseError | RequestNotFoundError | RoomNotOpenError>
  readonly withdrawBid: (
    actorAuthUserId: string,
    input: WithdrawBidInput,
  ) => Effect.Effect<RoomState, DatabaseError | RequestNotFoundError | RoomNotOpenError | BidNotFoundError>
  readonly acceptBid: (
    actorAuthUserId: string,
    input: AcceptBidInput,
  ) => Effect.Effect<RoomState, DatabaseError | RequestNotFoundError | RoomNotOpenError | BidNotFoundError>
  readonly expireRoom: (
    actorAuthUserId: string,
    requestId: string,
  ) => Effect.Effect<RoomState, DatabaseError | RequestNotFoundError | RoomNotOpenError>
}

export const RoomRepository = Context.GenericTag<RoomRepository>("@carebid/RoomRepository")
