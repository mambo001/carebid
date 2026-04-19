import { Either } from "effect"

import type { BidInput, WithdrawBidInput, AcceptBidInput } from "@carebid/shared"

import { RoomBid, RoomState } from "../entities"
import { RoomNotOpenError } from "../errors"

export const makeEmptyRoomState = (requestId: string, initialStatus: RoomState["status"] = "open"): RoomState =>
  new RoomState({
    requestId,
    status: initialStatus,
    awardedBidId: undefined,
    connectedViewers: 0,
    bids: [],
  })

export const placeBid = (
  state: RoomState,
  input: BidInput,
): Either.Either<RoomState, RoomNotOpenError> => {
  if (state.status !== "open") {
    return Either.left(new RoomNotOpenError({ message: `Request ${state.requestId} is not open` }))
  }

  const existingIndex = state.bids.findIndex((bid) => bid.providerId === input.providerId)

  const nextBid = new RoomBid({
    bidId: existingIndex >= 0 ? state.bids[existingIndex].bidId : `bid-${crypto.randomUUID()}`,
    providerId: input.providerId,
    providerDisplayName: input.providerDisplayName,
    amountCents: input.amountCents,
    availableDate: input.availableDate,
    notes: input.notes,
    status: "active",
  })

  const nextBids =
    existingIndex >= 0
      ? state.bids.map((bid, i) => (i === existingIndex ? nextBid : bid))
      : [...state.bids, nextBid]

  return Either.right(new RoomState({ ...state, bids: nextBids }))
}

export const withdrawBid = (
  state: RoomState,
  input: WithdrawBidInput,
): Either.Either<RoomState, RoomNotOpenError> => {
  if (state.status !== "open") {
    return Either.left(new RoomNotOpenError({ message: `Request ${state.requestId} is not open` }))
  }

  const nextBids = state.bids.map((bid) =>
    bid.providerId === input.providerId ? new RoomBid({ ...bid, status: "withdrawn" }) : bid,
  )

  return Either.right(new RoomState({ ...state, bids: nextBids }))
}

export const acceptBid = (
  state: RoomState,
  input: AcceptBidInput,
): Either.Either<RoomState, RoomNotOpenError> => {
  if (state.status !== "open") {
    return Either.left(new RoomNotOpenError({ message: `Request ${state.requestId} is not open` }))
  }

  const nextBids = state.bids.map((bid) =>
    bid.bidId === input.bidId ? bid : new RoomBid({ ...bid, status: "withdrawn" }),
  )

  return Either.right(
    new RoomState({
      ...state,
      status: "awarded",
      awardedBidId: input.bidId,
      bids: nextBids,
    }),
  )
}

export const expireRoom = (state: RoomState): Either.Either<RoomState, RoomNotOpenError> => {
  if (state.status !== "open") {
    return Either.left(new RoomNotOpenError({ message: `Request ${state.requestId} is not open` }))
  }

  const nextBids = state.bids.map((bid) => new RoomBid({ ...bid, status: "withdrawn" }))

  return Either.right(new RoomState({ ...state, status: "expired", bids: nextBids }))
}

export const syncStatus = (state: RoomState, status: RoomState["status"]): RoomState =>
  new RoomState({ ...state, status })

export const incrementViewers = (state: RoomState): RoomState =>
  new RoomState({ ...state, connectedViewers: state.connectedViewers + 1 })

export const decrementViewers = (state: RoomState): RoomState =>
  new RoomState({ ...state, connectedViewers: Math.max(0, state.connectedViewers - 1) })
