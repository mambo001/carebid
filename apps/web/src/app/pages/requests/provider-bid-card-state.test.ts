import { describe, expect, it } from "bun:test"

import type { AppSession } from "@carebid/shared"

import type { Bid } from "../../../lib/api"
import { getProviderBidActor, getProviderExistingBid } from "./provider-bid-card-state"

describe("getProviderBidActor", () => {
  it("returns null when there is no provider profile in the session", () => {
    const session: AppSession = {
      mode: "demo",
      authUserId: "demo-user-001",
      email: "demo@carebid.local",
      role: "provider",
    }

    expect(getProviderBidActor(session)).toBeNull()
  })

  it("returns the provider id and display name from the session", () => {
    const session: AppSession = {
      mode: "demo",
      authUserId: "demo-provider-001",
      email: "provider@carebid.local",
      role: "provider",
      providerProfile: {
        id: "provider-123",
        authUserId: "demo-provider-001",
        email: "provider@carebid.local",
        displayName: "Demo Provider",
        verificationStatus: "verified",
        verificationMode: "demo_auto",
        categories: ["specialist_consult"],
      },
    }

    expect(getProviderBidActor(session)).toEqual({
      providerId: "provider-123",
      providerDisplayName: "Demo Provider",
    })
  })
})

describe("getProviderExistingBid", () => {
  const bids: ReadonlyArray<Bid> = [
    {
      id: "bid-1",
      requestId: "request-1",
      providerId: "provider-1",
      providerDisplayName: "Provider One",
      amount: 120000,
      availableDate: "2026-04-25T00:00:00.000Z",
      notes: "Open slot available this week.",
      status: "active",
      createdAt: "2026-04-24T00:00:00.000Z",
    },
  ]

  it("returns the provider bid when one already exists", () => {
    expect(getProviderExistingBid("provider-1", bids)?.id).toBe("bid-1")
  })

  it("returns null when the provider has not bid", () => {
    expect(getProviderExistingBid("provider-2", bids)).toBeNull()
  })
})
