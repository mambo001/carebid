import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"

import { Bid, OpenRequest } from "./data/entities"
import { BidId, Money, RequestId, UserId } from "./data/branded"
import { serializeBid, serializeCareRequest } from "./program"

describe("HTTP response serialization", () => {
  it("serializes bid notes as nullable JSON", () => {
    const bid = new Bid({
      id: Schema.decodeUnknownSync(BidId)("bid_1"),
      requestId: Schema.decodeUnknownSync(RequestId)("req_1"),
      providerId: Schema.decodeUnknownSync(UserId)("provider_1"),
      providerDisplayName: "Provider One",
      amount: Schema.decodeUnknownSync(Money)(120000),
      availableDate: new Date("2026-04-25T00:00:00.000Z"),
      notes: Option.some("Open slot available"),
      status: "active",
      createdAt: new Date("2026-04-20T00:00:00.000Z"),
    })

    expect(serializeBid(bid).notes).toBe("Open slot available")
  })

  it("serializes room bids with nullable JSON notes", () => {
    const bid = new Bid({
      id: Schema.decodeUnknownSync(BidId)("bid_1"),
      requestId: Schema.decodeUnknownSync(RequestId)("req_1"),
      providerId: Schema.decodeUnknownSync(UserId)("provider_1"),
      providerDisplayName: "Provider One",
      amount: Schema.decodeUnknownSync(Money)(120000),
      availableDate: new Date("2026-04-25T00:00:00.000Z"),
      notes: Option.none(),
      status: "active",
      createdAt: new Date("2026-04-20T00:00:00.000Z"),
    })
    const request = new OpenRequest({
      id: Schema.decodeUnknownSync(RequestId)("req_1"),
      patientId: Schema.decodeUnknownSync(UserId)("patient_1"),
      title: "Request",
      description: "Description",
      category: "imaging",
      bids: [bid],
      openedAt: new Date("2026-04-20T00:00:00.000Z"),
    })

    const serialized = serializeCareRequest(request)

    expect(serialized._tag).toBe("OpenRequest")
    expect(serialized.bids[0].notes).toBeNull()
  })
})
