import { Schema } from "effect"
import { UserId, RequestId, BidId, Money } from "./branded"

export class Bid extends Schema.Class<Bid>("Bid")({
  id: BidId,
  requestId: RequestId,
  providerId: UserId,
  providerDisplayName: Schema.String,
  amount: Money,
  availableDate: Schema.Date,
  notes: Schema.OptionFromNullOr(Schema.String),
  status: Schema.Literal("active", "withdrawn", "accepted"),
  createdAt: Schema.Date,
}) {}

export class User extends Schema.Class<User>("User")({
  id: UserId,
  displayName: Schema.String,
  roles: Schema.Array(Schema.Literal("patient", "provider")),
  createdAt: Schema.Date,
}) {
  get isProvider(): boolean {
    return this.roles.includes("provider")
  }

  get isPatient(): boolean {
    return this.roles.includes("patient")
  }
}

export class DraftRequest extends Schema.TaggedClass<DraftRequest>("DraftRequest")("DraftRequest", {
  id: RequestId,
  patientId: UserId,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  createdAt: Schema.Date,
}) {}

export class OpenRequest extends Schema.TaggedClass<OpenRequest>("OpenRequest")("OpenRequest", {
  id: RequestId,
  patientId: UserId,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  bids: Schema.Array(Bid),
  openedAt: Schema.Date,
}) {}

export class AwardedRequest extends Schema.TaggedClass<AwardedRequest>("AwardedRequest")("AwardedRequest", {
  id: RequestId,
  patientId: UserId,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  bids: Schema.Array(Bid),
  awardedBidId: BidId,
  awardedAt: Schema.Date,
}) {}

export const CareRequest = Schema.Union(DraftRequest, OpenRequest, AwardedRequest)
export type CareRequest = typeof CareRequest.Type
