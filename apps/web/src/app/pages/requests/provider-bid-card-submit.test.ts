import { describe, expect, it } from "bun:test"

import { providerBidInitialValues, providerBidSubmitInput } from "./provider-bid-card-submit"

describe("providerBidSubmitInput", () => {
  it("normalizes edited numeric form values before sending to the backend", () => {
    const input = providerBidSubmitInput("request-1", {
      requestId: "request-1",
      amount: "125000",
      availableDate: "2026-04-27",
      notes: "Open slot available this week.",
    })

    expect(input).toEqual({
      requestId: "request-1",
      amount: 125000,
      availableDate: "2026-04-27",
      notes: "Open slot available this week.",
    })
  })

  it("sends null notes when the notes field is empty", () => {
    const input = providerBidSubmitInput("request-1", {
      requestId: "request-1",
      amount: 120000,
      availableDate: "2026-04-25",
      notes: "",
    })

    expect(input.notes).toBeNull()
  })
})

describe("providerBidInitialValues", () => {
  it("uses an existing bid when the provider has already submitted one", () => {
    expect(providerBidInitialValues("request-1", {
      id: "bid-1",
      requestId: "request-1",
      providerId: "provider-1",
      providerDisplayName: "Provider One",
      amount: 125000,
      availableDate: "2026-04-27T00:00:00.000Z",
      notes: "Updated slot.",
      status: "active",
      createdAt: "2026-04-24T00:00:00.000Z",
    })).toEqual({
      requestId: "request-1",
      amount: 125000,
      availableDate: "2026-04-27",
      notes: "Updated slot.",
    })
  })
})
