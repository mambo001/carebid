import { Context, Effect } from "effect"
import { BidId, RequestId, UserId } from "../data/branded"
import { Bid } from "../data/entities"
import { BidNotFound } from "../data/errors"

export class Bids extends Context.Tag("@carebid/Bids")<
  Bids,
  {
    readonly findById: (id: BidId) => Effect.Effect<Bid, BidNotFound>
    readonly findByRequest: (requestId: RequestId) => Effect.Effect<ReadonlyArray<Bid>>
    readonly findByProvider: (providerId: UserId) => Effect.Effect<ReadonlyArray<Bid>>
    readonly save: (bid: Bid) => Effect.Effect<void>
  }
>() {}
