import { Context, Effect, Schema } from "effect"
import { UserId, RequestId, BidId, Money } from "../data/branded"
import { DraftRequest, OpenRequest, AwardedRequest, Bid } from "../data/entities"
import {
  RequestNotFound,
  NotRequestOwner,
  RequestNotOpen,
  BidNotFound,
  InvalidAmount,
} from "../data/errors"

export class CreateRequestInput extends Schema.Class("CreateRequestInput")({
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
}) {}

export class PlaceBidInput extends Schema.Class("PlaceBidInput")({
  requestId: RequestId,
  amount: Money,
  availableDate: Schema.Date,
  notes: Schema.OptionFromNullOr(Schema.String),
}) {}

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
    readonly open: (requestId: RequestId, patientId: UserId) => Effect.Effect<OpenRequest, RequestNotFound | NotRequestOwner>
    readonly placeBid: (input: PlaceBidInput, providerId: UserId) => Effect.Effect<Bid, RequestNotFound | RequestNotOpen | InvalidAmount>
    readonly withdrawBid: (bidId: BidId, providerId: UserId) => Effect.Effect<Bid, BidNotFound | RequestNotOpen>
    readonly acceptBid: (requestId: RequestId, bidId: BidId, patientId: UserId) => Effect.Effect<AwardedRequest, DomainError>
    readonly expire: (requestId: RequestId, patientId: UserId) => Effect.Effect<OpenRequest, DomainError>
  }
>() {}
