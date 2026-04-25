import { Schema } from "@effect/schema"

export const UserId = Schema.String.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export const RequestId = Schema.String.pipe(Schema.brand("RequestId"))
export type RequestId = typeof RequestId.Type

export const BidId = Schema.String.pipe(Schema.brand("BidId"))
export type BidId = typeof BidId.Type

export const Money = Schema.Number.pipe(
  Schema.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000 })),
  Schema.brand("Money")
)
export type Money = typeof Money.Type
