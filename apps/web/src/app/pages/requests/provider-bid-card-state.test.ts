import { describe, expect, it } from "bun:test"

import type { AppSession } from "@carebid/shared"

import { getProviderBidActor } from "./provider-bid-card-state"

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
