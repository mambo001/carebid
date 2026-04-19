import { Schema } from "effect"

export class RoomBid extends Schema.Class<RoomBid>("RoomBid")({
  bidId: Schema.String,
  providerId: Schema.String,
  providerDisplayName: Schema.String,
  amount: Schema.Number,
  availableDate: Schema.String,
  notes: Schema.optional(Schema.String),
  status: Schema.Literal("active", "withdrawn"),
}) {}

export class RoomState extends Schema.Class<RoomState>("RoomState")({
  requestId: Schema.String,
  status: Schema.Literal("draft", "open", "awarded", "expired"),
  awardedBidId: Schema.optional(Schema.String),
  connectedViewers: Schema.Number,
  bids: Schema.Array(RoomBid),
}) {}

export class CareRequest extends Schema.Class<CareRequest>("CareRequest")({
  id: Schema.String,
  category: Schema.Literal("specialist_consult", "imaging"),
  title: Schema.String,
  sanitizedSummary: Schema.String,
  targetBudget: Schema.Number,
  locationCity: Schema.String,
  locationRegion: Schema.String,
  preferredStartDate: Schema.String,
  preferredEndDate: Schema.String,
  urgency: Schema.Literal("routine", "soon", "urgent"),
  serviceMode: Schema.Literal("in_person", "telehealth", "either"),
  status: Schema.Literal("draft", "open", "awarded", "expired"),
  expiresAt: Schema.String,
}) {}

export class AppSession extends Schema.Class<AppSession>("AppSession")({
  mode: Schema.Literal("demo"),
  authUserId: Schema.String,
  email: Schema.String,
  role: Schema.optional(Schema.Literal("patient", "provider")),
  patientProfile: Schema.optional(
    Schema.Struct({
      id: Schema.String,
      authUserId: Schema.String,
      email: Schema.String,
      displayName: Schema.String,
      locationCity: Schema.String,
      locationRegion: Schema.String,
    }),
  ),
  providerProfile: Schema.optional(
    Schema.Struct({
      id: Schema.String,
      authUserId: Schema.String,
      email: Schema.String,
      displayName: Schema.String,
      licenseRegion: Schema.optional(Schema.String),
      verificationStatus: Schema.Literal("verified"),
      verificationMode: Schema.Literal("demo_auto"),
      categories: Schema.Array(Schema.Literal("specialist_consult", "imaging")),
    }),
  ),
}) {}
