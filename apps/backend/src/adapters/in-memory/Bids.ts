import { Effect, Layer, Ref } from "effect"
import { Bids } from "../../ports/Bids"
import { RequestId, BidId } from "../../data/branded"
import { Bid } from "../../data/entities"
import { BidNotFound } from "../../data/errors"

export const make = Effect.gen(function* () {
  const store = yield* Ref.make(new Map<string, Bid>())

  const findByRequest = (requestId: RequestId) =>
    Ref.get(store).pipe(
      Effect.map((map) =>
        Array.from(map.values()).filter((b) => b.requestId === requestId)
      )
    )

  const findById = (id: BidId) =>
    Ref.get(store).pipe(
      Effect.map((map) => map.get(id)),
      Effect.flatMap((bid) =>
        bid ? Effect.succeed(bid) : new BidNotFound({ bidId: id })
      )
    )

  const save = (bid: Bid) =>
    Ref.update(store, (map) => new Map(map).set(bid.id, bid))

  return Bids.of({ findByRequest, findById, save })
})

export const layer = Layer.effect(Bids, make)
