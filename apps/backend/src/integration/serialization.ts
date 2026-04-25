import { Option } from "effect"

import { Bid, CareRequest } from "../data/entities"

export const serializeBid = (bid: Bid) => ({
  id: bid.id,
  requestId: bid.requestId,
  providerId: bid.providerId,
  providerDisplayName: bid.providerDisplayName,
  amount: bid.amount,
  availableDate: bid.availableDate.toISOString(),
  notes: Option.getOrNull(bid.notes),
  status: bid.status,
  createdAt: bid.createdAt.toISOString(),
})

export const serializeCareRequest = (request: CareRequest) => {
  switch (request._tag) {
    case "DraftRequest":
      return {
        ...request,
        createdAt: request.createdAt.toISOString(),
      }
    case "OpenRequest":
      return {
        ...request,
        bids: request.bids.map(serializeBid),
        openedAt: request.openedAt.toISOString(),
      }
    case "AwardedRequest":
      return {
        ...request,
        bids: request.bids.map(serializeBid),
        awardedAt: request.awardedAt.toISOString(),
      }
  }
}
