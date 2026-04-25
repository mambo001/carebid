import { Context, Effect } from "effect"
import { UserId, RequestId, BidId, Money } from "../data/branded"
import { DraftRequest, OpenRequest, AwardedRequest, Bid } from "../data/entities"
import {
  RequestNotFound,
  NotRequestOwner,
  RequestNotOpen,
  BidNotFound,
  InvalidAmount,
} from "../data/errors"

export interface CreateRequestInput {
  readonly title: string
  readonly description: string
  readonly category: string
}

export interface PlaceBidInput {
  readonly requestId: RequestId
  readonly amount: Money
  readonly availableDate: Date
  readonly notes: string | null
}

export type DomainError =
  | RequestNotFound
  | NotRequestOwner
  | RequestNotOpen
  | BidNotFound
  | InvalidAmount

export class RequestCommands extends Context.Tag("@carebid/RequestCommands")<
  RequestCommands,
  {
    readonly create: (input: CreateRequestInput, patientId: UserId) => Effect.Effect<DraftRequest>
    readonly open: (requestId: RequestId, patientId: UserId) => Effect.Effect<OpenRequest, RequestNotFound | NotRequestOwner | RequestNotOpen>
    readonly placeBid: (input: PlaceBidInput, providerId: UserId) => Effect.Effect<Bid, RequestNotFound | RequestNotOpen>
    readonly withdrawBid: (bidId: BidId, providerId: UserId) => Effect.Effect<Bid, BidNotFound | RequestNotOpen | RequestNotFound>
    readonly acceptBid: (requestId: RequestId, bidId: BidId, patientId: UserId) => Effect.Effect<AwardedRequest, DomainError>
    readonly expire: (requestId: RequestId, patientId: UserId) => Effect.Effect<OpenRequest, DomainError>
  }
>() {}
