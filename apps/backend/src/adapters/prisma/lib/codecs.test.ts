import { expect, it, describe } from "@effect/vitest"
import { Effect, Either, Option } from "effect"
import { decodeBid, encodeBid, decodeCareRequest, encodeCareRequest, encodeCareRequestWrite, PrismaBid, PrismaCareRequest } from "./codecs"
import { Bid, DraftRequest, OpenRequest, AwardedRequest } from "../../../data/entities"

describe("Bid codecs", () => {
  const mockPrismaBid: PrismaBid = {
    id: "bid_123",
    careRequestId: "req_456",
    providerId: "user_789",
    amount: 15000, // $150.00 in cents
    availableDate: new Date("2024-06-15"),
    notes: "Available afternoons",
    status: "active",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    provider: {
      displayName: "Dr. Smith",
    },
  }

  it.effect("should decode PrismaBid to domain Bid", () =>
    Effect.gen(function* () {
      const result = yield* decodeBid(mockPrismaBid)
      
      expect(result.id).toBe("bid_123")
      expect(result.requestId).toBe("req_456")
      expect(result.providerId).toBe("user_789")
      expect(result.providerDisplayName).toBe("Dr. Smith")
      expect(result.amount).toBe(150) // $150.00 (cents to dollars)
      expect(result.status).toBe("active")
      expect(Option.isSome(result.notes)).toBe(true)
      expect(result.notes.pipe(Option.getOrNull)).toBe("Available afternoons")
    })
  )

  it.effect("should handle null notes", () =>
    Effect.gen(function* () {
      const bidWithNullNotes = { ...mockPrismaBid, notes: null }
      const result = yield* decodeBid(bidWithNullNotes)
      
      expect(Option.isNone(result.notes)).toBe(true)
    })
  )

  it.effect("should map rejected status to withdrawn", () =>
    Effect.gen(function* () {
      const rejectedBid = { ...mockPrismaBid, status: "rejected" as const }
      const result = yield* decodeBid(rejectedBid)
      
      expect(result.status).toBe("withdrawn")
    })
  )

  it.effect("should map expired status to withdrawn", () =>
    Effect.gen(function* () {
      const expiredBid = { ...mockPrismaBid, status: "expired" as const }
      const result = yield* decodeBid(expiredBid)
      
      expect(result.status).toBe("withdrawn")
    })
  )

  it.effect("should encode domain Bid to PrismaBid", () =>
    Effect.gen(function* () {
      const domainBid = yield* decodeBid(mockPrismaBid)
      const encoded = encodeBid(domainBid)
      
      expect(encoded.id).toBe("bid_123")
      expect(encoded.careRequestId).toBe("req_456")
      expect(encoded.providerId).toBe("user_789")
      expect(encoded.amount).toBe(15000) // Back to cents
      expect(encoded.status).toBe("active")
      expect(encoded.notes).toBe("Available afternoons")
    })
  )

  it.effect("should round-trip money conversion correctly", () =>
    Effect.gen(function* () {
      const bidWithOddCents = { ...mockPrismaBid, amount: 12345 } // $123.45
      const domainBid = yield* decodeBid(bidWithOddCents)
      expect(domainBid.amount).toBe(123.45)
      
      const encoded = encodeBid(domainBid)
      expect(encoded.amount).toBe(12345)
    })
  )
})

describe("CareRequest codecs", () => {
  const mockPrismaDraftRequest: PrismaCareRequest = {
    id: "req_123",
    patientId: "user_456",
    category: "specialist_consult",
    title: "Consultation Needed",
    sanitizedSummary: "Need a specialist consultation for back pain",
    targetBudget: 50000, // $500
    locationCity: "Seattle",
    locationRegion: "WA",
    preferredStartDate: new Date("2024-06-01"),
    preferredEndDate: new Date("2024-06-30"),
    urgency: "soon",
    serviceMode: "in_person",
    details: {},
    status: "draft",
    expiresAt: new Date("2024-07-01"),
    awardedBidId: null,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    bids: [],
  }

  const mockPrismaOpenRequest: PrismaCareRequest = {
    ...mockPrismaDraftRequest,
    id: "req_open",
    status: "open",
    bids: [
      {
        id: "bid_1",
        careRequestId: "req_open",
        providerId: "prov_1",
        amount: 20000,
        availableDate: new Date("2024-06-10"),
        notes: null,
        status: "active",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      },
    ],
  }

  const mockPrismaAwardedRequest: PrismaCareRequest = {
    ...mockPrismaOpenRequest,
    id: "req_awarded",
    status: "awarded",
    awardedBidId: "bid_1",
  }

  it.effect("should decode draft request", () =>
    Effect.gen(function* () {
      const result = yield* decodeCareRequest(mockPrismaDraftRequest)
      
      expect(result._tag).toBe("DraftRequest")
      expect(result.id).toBe("req_123")
      expect(result.patientId).toBe("user_456")
      expect(result.title).toBe("Consultation Needed")
      expect(result.description).toBe("Need a specialist consultation for back pain")
      expect(result.category).toBe("specialistConsult")
    })
  )

  it.effect("should decode open request", () =>
    Effect.gen(function* () {
      const result = yield* decodeCareRequest(mockPrismaOpenRequest)
      
      expect(result._tag).toBe("OpenRequest")
      expect(result.id).toBe("req_open")
      expect(result.bids.length).toBe(1)
      expect(result.bids[0].amount).toBe(200) // $200 (converted from cents)
      expect(result.openedAt).toEqual(mockPrismaOpenRequest.createdAt)
    })
  )

  it.effect("should decode awarded request", () =>
    Effect.gen(function* () {
      const result = yield* decodeCareRequest(mockPrismaAwardedRequest)
      
      expect(result._tag).toBe("AwardedRequest")
      expect(result.awardedBidId).toBe("bid_1")
      expect(result.bids.length).toBe(1)
    })
  )

  it.effect("should fail for awarded request without awardedBidId", () =>
    Effect.gen(function* () {
      const invalidRequest = { ...mockPrismaAwardedRequest, awardedBidId: null }
      const result = yield* decodeCareRequest(invalidRequest).pipe(
        Effect.either
      )
      
      expect(Either.isLeft(result)).toBe(true)
    })
  )

  it.effect("should encode DraftRequest", () =>
    Effect.gen(function* () {
      const draft = yield* decodeCareRequest(mockPrismaDraftRequest)
      const encoded = encodeCareRequest(draft)
      
      expect(encoded.status).toBe("draft")
      expect(encoded.awardedBidId).toBeNull()
      expect(encoded.title).toBe("Consultation Needed")
      expect(encoded.category).toBe("specialist_consult")
    })
  )

  it.effect("should encode scalar care request write data without relation fields", () =>
    Effect.gen(function* () {
      const draft = yield* decodeCareRequest(mockPrismaDraftRequest)
      const encoded = encodeCareRequestWrite(draft)

      expect("bids" in encoded).toBe(false)
      expect(encoded.status).toBe("draft")
      expect(encoded.patientId).toBe("user_456")
    })
  )

  it.effect("should encode OpenRequest", () =>
    Effect.gen(function* () {
      const open = yield* decodeCareRequest(mockPrismaOpenRequest)
      const encoded = encodeCareRequest(open)
      
      expect(encoded.status).toBe("open")
      expect(encoded.awardedBidId).toBeNull()
      expect(encoded.bids.length).toBe(1)
      expect(encoded.createdAt).toEqual(mockPrismaOpenRequest.createdAt)
    })
  )

  it.effect("should encode AwardedRequest", () =>
    Effect.gen(function* () {
      const awarded = yield* decodeCareRequest(mockPrismaAwardedRequest)
      const encoded = encodeCareRequest(awarded)
      
      expect(encoded.status).toBe("awarded")
      expect(encoded.awardedBidId).toBe("bid_1")
    })
  )

  it.effect("should map category correctly", () =>
    Effect.gen(function* () {
      const imagingRequest = { ...mockPrismaDraftRequest, category: "imaging" as const }
      const result = yield* decodeCareRequest(imagingRequest)
      
      expect(result.category).toBe("imaging")
      
      const encoded = encodeCareRequest(result)
      expect(encoded.category).toBe("imaging")
    })
  )
})
