import { describe, expect, it } from "@effect/vitest"

import { bidSaveWhere } from "./Bids"

describe("bidSaveWhere", () => {
  it("uses the request/provider business key so repeat provider bids update instead of inserting", () => {
    expect(bidSaveWhere({ requestId: "request-1", providerId: "provider-1" })).toEqual({
      careRequestId_providerId: {
        careRequestId: "request-1",
        providerId: "provider-1",
      },
    })
  })
})
