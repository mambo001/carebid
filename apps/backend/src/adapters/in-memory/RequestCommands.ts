import { Effect, Layer } from "effect"
import { RequestCommands } from "../../ports/RequestCommands"
import { CareRequests } from "../../ports/CareRequests"
import { Bids } from "../../ports/Bids"
import { RoomNotifier } from "../../ports/RoomNotifier"
import { Users } from "../../ports/Users"
import { DraftRequest, OpenRequest, AwardedRequest, Bid } from "../../data/entities"
import { RequestNotFound, NotRequestOwner, RequestNotOpen, BidNotFound } from "../../data/errors"
import { RequestId, BidId, UserId, Money } from "../../data/branded"
import { Schema } from "effect"
import { Option } from "effect"

export const make = Effect.gen(function* () {
  const requests = yield* CareRequests
  const bids = yield* Bids
  const notifier = yield* RoomNotifier
  const users = yield* Users

  const create = (input: { title: string; description: string; category: string }, patientId: UserId): Effect.Effect<DraftRequest> =>
    Effect.gen(function* () {
      const request = new DraftRequest({
        id: Schema.decodeUnknownSync(RequestId)(crypto.randomUUID()),
        patientId,
        title: input.title,
        description: input.description,
        category: input.category,
        createdAt: new Date(),
      })
      yield* requests.save(request)
      return request
    })

  const open = (requestId: RequestId, patientId: UserId): Effect.Effect<OpenRequest, RequestNotFound | NotRequestOwner | RequestNotOpen> =>
    Effect.gen(function* () {
      const request = yield* requests.findById(requestId)
      
      if (request._tag !== "DraftRequest") {
        return yield* new RequestNotOpen({ requestId, status: request._tag })
      }
      
      if (request.patientId !== patientId) {
        return yield* new NotRequestOwner({ requestId, userId: patientId })
      }

      const openRequest = new OpenRequest({
        id: request.id,
        patientId: request.patientId,
        title: request.title,
        description: request.description,
        category: request.category,
        bids: [],
        openedAt: new Date(),
      })

      yield* requests.save(openRequest)
      yield* notifier.notifyRoomUpdated(requestId)
      return openRequest
    })

  const placeBid = (input: { requestId: RequestId; amount: Money; availableDate: Date; notes: string | null }, providerId: UserId): Effect.Effect<Bid, RequestNotFound | RequestNotOpen> =>
    Effect.gen(function* () {
      const request = yield* requests.findById(input.requestId)
      
      if (request._tag !== "OpenRequest") {
        return yield* new RequestNotOpen({ requestId: input.requestId, status: request._tag })
      }

      const provider = yield* users.findById(providerId)
      
      const bid = new Bid({
        id: Schema.decodeUnknownSync(BidId)(crypto.randomUUID()),
        requestId: input.requestId,
        providerId,
        providerDisplayName: provider.displayName,
        amount: input.amount,
        availableDate: input.availableDate,
        notes: Option.fromNullable(input.notes),
        status: "active",
        createdAt: new Date(),
      })

      yield* bids.save(bid)
      yield* notifier.notifyRoomUpdated(input.requestId)
      return bid
    })

  const withdrawBid = (bidId: BidId, providerId: UserId): Effect.Effect<Bid, BidNotFound | RequestNotOpen | RequestNotFound> =>
    Effect.gen(function* () {
      const bid = yield* bids.findById(bidId)
      const request = yield* requests.findById(bid.requestId)
      
      if (request._tag !== "OpenRequest") {
        return yield* new RequestNotOpen({ requestId: bid.requestId, status: request._tag })
      }

      const updatedBid = new Bid({
        ...bid,
        status: "withdrawn",
      })

      yield* bids.save(updatedBid)
      yield* notifier.notifyRoomUpdated(bid.requestId)
      return updatedBid
    })

  const acceptBid = (requestId: RequestId, bidId: BidId, patientId: UserId): Effect.Effect<AwardedRequest, RequestNotFound | NotRequestOwner | RequestNotOpen | BidNotFound> =>
    Effect.gen(function* () {
      const request = yield* requests.findById(requestId)
      
      if (request._tag !== "OpenRequest") {
        return yield* new RequestNotOpen({ requestId, status: request._tag })
      }
      
      if (request.patientId !== patientId) {
        return yield* new NotRequestOwner({ requestId, userId: patientId })
      }

      const bid = yield* bids.findById(bidId)

      // Mark all other bids as withdrawn
      const updatedBids = yield* Effect.forEach(request.bids, (b) =>
        b.id === bidId 
          ? Effect.succeed(b)
          : Effect.succeed(new Bid({ ...b, status: "withdrawn" })),
        { concurrency: 1 }
      )

      const awardedRequest = new AwardedRequest({
        id: request.id,
        patientId: request.patientId,
        title: request.title,
        description: request.description,
        category: request.category,
        bids: updatedBids,
        awardedBidId: bidId,
        awardedAt: new Date(),
      })

      yield* requests.save(awardedRequest)
      yield* notifier.notifyRoomUpdated(requestId)
      return awardedRequest
    })

  const expire = (requestId: RequestId, patientId: UserId): Effect.Effect<OpenRequest, RequestNotFound | NotRequestOwner | RequestNotOpen> =>
    Effect.gen(function* () {
      const request = yield* requests.findById(requestId)
      
      if (request._tag !== "OpenRequest") {
        return yield* new RequestNotOpen({ requestId, status: request._tag })
      }
      
      if (request.patientId !== patientId) {
        return yield* new NotRequestOwner({ requestId, userId: patientId })
      }

      // Withdraw all bids
      const updatedBids = yield* Effect.forEach(request.bids, (b) =>
        Effect.succeed(new Bid({ ...b, status: "withdrawn" })),
        { concurrency: 1 }
      )

      const expiredRequest = new OpenRequest({
        ...request,
        bids: updatedBids,
      })

      yield* requests.save(expiredRequest)
      yield* notifier.notifyRoomUpdated(requestId)
      return expiredRequest
    })

  return RequestCommands.of({ create, open, placeBid, withdrawBid, acceptBid, expire })
})

export const layer = Layer.effect(RequestCommands, make)
