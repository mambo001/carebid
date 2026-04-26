import { describe, expect, it } from "bun:test"

import { formatBidAmount, getRoomWorkspaceControls } from "./room-workspace"

describe("getRoomWorkspaceControls", () => {
  it("shows draft-opening controls for the patient workspace", () => {
    expect(getRoomWorkspaceControls("patient", "DraftRequest")).toEqual({
      canAcceptBid: false,
      canOpenRequest: true,
      canPlaceBid: false,
    })
  })

  it("shows bid acceptance controls for open requests in the patient workspace", () => {
    expect(getRoomWorkspaceControls("patient", "OpenRequest")).toEqual({
      canAcceptBid: true,
      canOpenRequest: false,
      canPlaceBid: false,
    })
  })

  it("shows bid placement controls for open requests in the provider workspace", () => {
    expect(getRoomWorkspaceControls("provider", "OpenRequest")).toEqual({
      canAcceptBid: false,
      canOpenRequest: false,
      canPlaceBid: true,
    })
  })
})

describe("formatBidAmount", () => {
  it("formats API bid amounts as currency units without dividing by cents", () => {
    expect(formatBidAmount(1200)).toBe("PHP 1,200")
  })
})
