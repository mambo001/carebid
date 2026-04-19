import { Schema } from "effect"

export class CareRequest extends Schema.Class<CareRequest>("CareRequest")({
  id: Schema.String,
  category: Schema.Literal("specialist_consult", "imaging"),
  title: Schema.String,
  sanitizedSummary: Schema.String,
  targetBudgetCents: Schema.Number,
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
