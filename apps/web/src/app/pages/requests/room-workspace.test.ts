import { describe, expect, it } from "bun:test"

import { getRoomWorkspaceControls } from "./room-workspace"

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
