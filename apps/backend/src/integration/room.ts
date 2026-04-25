import { Bid } from "../data/entities"

export const sortBidsByAmount = (bids: readonly Bid[]): readonly Bid[] =>
  [...bids].sort((a, b) => a.amount - b.amount)

export const getActiveBids = (bids: readonly Bid[]): readonly Bid[] =>
  bids.filter((b) => b.status === "active")

export const formatRoomSnapshot = (request: {
  id: string
  status: string
  bids: readonly Bid[]
  awardedBidId?: string
}) => ({
  requestId: request.id,
  status: request.status,
  awardedBidId: request.awardedBidId,
  leaderboard: sortBidsByAmount(getActiveBids(request.bids)).map((bid) => ({
    bidId: bid.id,
    providerId: bid.providerId,
    providerDisplayName: bid.providerDisplayName,
    amount: bid.amount,
    availableDate: bid.availableDate,
    notes: bid.notes,
  })),
})
