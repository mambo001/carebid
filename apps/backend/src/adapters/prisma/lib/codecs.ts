import { Effect, Schema, Option } from "effect"
import { ParseResult } from "effect"
import { UserId, RequestId, BidId, Money } from "../../../data/branded"
import { Bid, DraftRequest, OpenRequest, AwardedRequest, CareRequest } from "../../../data/entities"

// ============================================================================
// Prisma Enum Types (snake_case)
// ============================================================================

export type PrismaRequestStatus = "draft" | "open" | "awarded" | "expired"
export type PrismaBidStatus = "active" | "withdrawn" | "accepted" | "rejected" | "expired"
export type PrismaProviderCategory = "specialist_consult" | "imaging"

// ============================================================================
// Prisma Row Types (what Prisma client returns)
// ============================================================================

export interface PrismaBid {
  readonly id: string
  readonly careRequestId: string
  readonly providerId: string
  readonly amount: number // cents
  readonly availableDate: Date
  readonly notes: string | null
  readonly status: PrismaBidStatus
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly provider?: {
    readonly displayName: string
  }
}

export interface PrismaCareRequest {
  readonly id: string
  readonly patientId: string
  readonly category: PrismaProviderCategory
  readonly title: string
  readonly sanitizedSummary: string
  readonly targetBudget: number // cents
  readonly locationCity: string
  readonly locationRegion: string
  readonly preferredStartDate: Date
  readonly preferredEndDate: Date
  readonly urgency: string
  readonly serviceMode: string
  readonly details: unknown
  readonly status: PrismaRequestStatus
  readonly expiresAt: Date
  readonly awardedBidId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly bids?: readonly PrismaBid[]
}

// ============================================================================
// Domain Status Types (camelCase)
// ============================================================================

export type DomainBidStatus = "active" | "withdrawn" | "accepted"
export type DomainProviderCategory = "specialistConsult" | "imaging"

// ============================================================================
// Money Conversion Helpers
// ============================================================================

const centsToDollars = (cents: number): number => cents / 100

const dollarsToCents = (dollars: number): number => Math.round(dollars * 100)

// ============================================================================
// Enum Mapping Helpers
// ============================================================================

const decodeProviderCategory = (category: PrismaProviderCategory): DomainProviderCategory => {
  switch (category) {
    case "specialist_consult":
      return "specialistConsult"
    case "imaging":
      return "imaging"
  }
}

const encodeProviderCategory = (category: DomainProviderCategory): PrismaProviderCategory => {
  switch (category) {
    case "specialistConsult":
      return "specialist_consult"
    case "imaging":
      return "imaging"
  }
}

const decodeBidStatus = (status: PrismaBidStatus): DomainBidStatus => {
  switch (status) {
    case "active":
      return "active"
    case "withdrawn":
      return "withdrawn"
    case "accepted":
      return "accepted"
    default:
      // rejected and expired map to withdrawn for domain
      return "withdrawn"
  }
}

const encodeBidStatus = (status: DomainBidStatus): PrismaBidStatus => {
  return status
}

// ============================================================================
// Validation Helpers
// ============================================================================

const validateMoney = (dollars: number): Effect.Effect<Money, ParseResult.ParseError> =>
  Schema.decode(Money)(dollars)

const validateBidId = (id: string): Effect.Effect<BidId, ParseResult.ParseError> =>
  Schema.decode(BidId)(id)

const validateRequestId = (id: string): Effect.Effect<RequestId, ParseResult.ParseError> =>
  Schema.decode(RequestId)(id)

const validateUserId = (id: string): Effect.Effect<UserId, ParseResult.ParseError> =>
  Schema.decode(UserId)(id)

const decodeOptionString = (value: string | null): Option.Option<string> =>
  value === null ? Option.none() : Option.some(value)

// ============================================================================
// Bid Codec
// ============================================================================

export const decodeBid = (prismaBid: PrismaBid): Effect.Effect<Bid, ParseResult.ParseError> =>
  Effect.gen(function* () {
    const id = yield* validateBidId(prismaBid.id)
    const requestId = yield* validateRequestId(prismaBid.careRequestId)
    const providerId = yield* validateUserId(prismaBid.providerId)
    const amount = yield* validateMoney(centsToDollars(prismaBid.amount))
    const providerDisplayName = prismaBid.provider?.displayName ?? "Unknown Provider"

    return new Bid({
      id,
      requestId,
      providerId,
      providerDisplayName,
      amount,
      availableDate: prismaBid.availableDate,
      notes: decodeOptionString(prismaBid.notes),
      status: decodeBidStatus(prismaBid.status),
      createdAt: prismaBid.createdAt,
    })
  })

export const encodeBid = (bid: Bid): PrismaBid => ({
  id: bid.id,
  careRequestId: bid.requestId,
  providerId: bid.providerId,
  amount: dollarsToCents(bid.amount),
  availableDate: bid.availableDate,
  notes: Option.match(bid.notes, {
    onNone: () => null,
    onSome: (n) => n,
  }),
  status: encodeBidStatus(bid.status),
  createdAt: bid.createdAt,
  updatedAt: bid.createdAt, // Use createdAt as default for encode
})

// ============================================================================
// CareRequest Codec
// ============================================================================

export const decodeCareRequest = (
  prismaRequest: PrismaCareRequest
): Effect.Effect<CareRequest, ParseResult.ParseError | Error> =>
  Effect.gen(function* () {
    const id = yield* validateRequestId(prismaRequest.id)
    const patientId = yield* validateUserId(prismaRequest.patientId)
    const category = decodeProviderCategory(prismaRequest.category)
    
    const bids = prismaRequest.bids
      ? yield* Effect.all(prismaRequest.bids.map(decodeBid), { concurrency: "unbounded" })
      : []

    switch (prismaRequest.status) {
      case "draft": {
        return new DraftRequest({
          id,
          patientId,
          title: prismaRequest.title,
          description: prismaRequest.sanitizedSummary,
          category,
          createdAt: prismaRequest.createdAt,
        })
      }

      case "open": {
        return new OpenRequest({
          id,
          patientId,
          title: prismaRequest.title,
          description: prismaRequest.sanitizedSummary,
          category,
          bids,
          openedAt: prismaRequest.createdAt,
        })
      }

      case "awarded": {
        if (!prismaRequest.awardedBidId) {
          return yield* Effect.fail(
            new Error("Awarded request must have an awardedBidId")
          )
        }

        const awardedBidId = yield* validateBidId(prismaRequest.awardedBidId)

        return new AwardedRequest({
          id,
          patientId,
          title: prismaRequest.title,
          description: prismaRequest.sanitizedSummary,
          category,
          bids,
          awardedBidId,
          awardedAt: prismaRequest.updatedAt,
        })
      }

      case "expired": {
        // Expired requests are treated as open requests with expired status
        // Domain model doesn't have a separate expired state
        return new OpenRequest({
          id,
          patientId,
          title: prismaRequest.title,
          description: prismaRequest.sanitizedSummary,
          category,
          bids,
          openedAt: prismaRequest.createdAt,
        })
      }

      default: {
        return yield* Effect.fail(
          new Error(`Unknown request status: ${prismaRequest.status}`)
        )
      }
    }
  })

export const encodeCareRequest = (careRequest: CareRequest): PrismaCareRequest => {
  const baseFields = {
    id: careRequest.id,
    patientId: careRequest.patientId,
    category: encodeProviderCategory(careRequest.category as DomainProviderCategory),
    title: careRequest.title,
    sanitizedSummary: careRequest.description,
    targetBudget: 0, // Required by Prisma but not in domain model
    locationCity: "", // Required by Prisma but not in domain model
    locationRegion: "", // Required by Prisma but not in domain model
    preferredStartDate: new Date(), // Required by Prisma but not in domain model
    preferredEndDate: new Date(), // Required by Prisma but not in domain model
    urgency: "routine", // Required by Prisma but not in domain model
    serviceMode: "in_person", // Required by Prisma but not in domain model
    details: {}, // Required by Prisma but not in domain model
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    updatedAt: new Date(),
    bids: [],
  }

  switch (careRequest._tag) {
    case "DraftRequest": {
      return {
        ...baseFields,
        status: "draft",
        awardedBidId: null,
        createdAt: careRequest.createdAt,
      }
    }

    case "OpenRequest": {
      return {
        ...baseFields,
        status: "open",
        awardedBidId: null,
        createdAt: careRequest.openedAt,
        bids: careRequest.bids.map(encodeBid),
      }
    }

    case "AwardedRequest": {
      return {
        ...baseFields,
        status: "awarded",
        awardedBidId: careRequest.awardedBidId,
        createdAt: careRequest.awardedAt,
        bids: careRequest.bids.map(encodeBid),
      }
    }
  }
}

export const encodeCareRequestWrite = (careRequest: CareRequest) => {
  const { bids: _bids, ...writeData } = encodeCareRequest(careRequest)

  return writeData
}

// ============================================================================
// Batch Decode Helpers
// ============================================================================

export const decodeManyBids = (
  prismaBids: readonly PrismaBid[]
): Effect.Effect<readonly Bid[], ParseResult.ParseError> =>
  Effect.all(prismaBids.map(decodeBid), { concurrency: "unbounded" })

export const decodeManyCareRequests = (
  prismaRequests: readonly PrismaCareRequest[]
): Effect.Effect<readonly CareRequest[], ParseResult.ParseError | Error> =>
  Effect.all(prismaRequests.map(decodeCareRequest), { concurrency: "unbounded" })
