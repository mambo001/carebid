import { Context, Effect } from "effect"
import { RequestId, BidId } from "../data/branded"
import { Bid } from "../data/entities"
import { BidNotFound } from "../data/errors"

export class Bids extends Context.Tag("@carebid/Bids")<
  Bids,
  {
    readonly findByRequest: (requestId: RequestId) => Effect.Effect<readonly Bid[]>
    readonly findById: (id: BidId) => Effect.Effect<Bid, BidNotFound>
    readonly save: (bid: Bid) => Effect.Effect<void>
  }
>() {}
