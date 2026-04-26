export type RoomWorkspace = "patient" | "provider"

export type RequestTag = "DraftRequest" | "OpenRequest" | "AwardedRequest"

export const getRoomWorkspaceControls = (workspace: RoomWorkspace, requestTag: RequestTag) => ({
  canAcceptBid: workspace === "patient" && requestTag === "OpenRequest",
  canOpenRequest: workspace === "patient" && requestTag === "DraftRequest",
  canPlaceBid: workspace === "provider" && requestTag === "OpenRequest",
})

export const formatBidAmount = (amount: number) =>
  `PHP ${amount.toLocaleString()}`
