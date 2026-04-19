import * as Schema from "@effect/schema/Schema"

import {
  bidStatuses,
  bodyAreas,
  facilityTypes,
  imagingTypes,
  providerCategories,
  providerVerificationModes,
  providerVerificationStatuses,
  requestEventTypes,
  requestStatuses,
  serviceModes,
  specialistVisitTypes,
  symptomDurations,
  urgencyLevels,
} from "./constants"

const makeLiteral = <Values extends readonly [string, ...string[]]>(values: Values) =>
  Schema.Literal(...values)

export const ProviderCategorySchema = makeLiteral(providerCategories)
export type ProviderCategory = typeof ProviderCategorySchema.Type

export const RequestStatusSchema = makeLiteral(requestStatuses)
export type RequestStatus = typeof RequestStatusSchema.Type

export const BidStatusSchema = makeLiteral(bidStatuses)
export type BidStatus = typeof BidStatusSchema.Type

export const UrgencySchema = makeLiteral(urgencyLevels)
export type Urgency = typeof UrgencySchema.Type

export const ServiceModeSchema = makeLiteral(serviceModes)
export type ServiceMode = typeof ServiceModeSchema.Type

export const ProviderVerificationModeSchema = makeLiteral(providerVerificationModes)
export type ProviderVerificationMode = typeof ProviderVerificationModeSchema.Type

export const ProviderVerificationStatusSchema = makeLiteral(providerVerificationStatuses)
export type ProviderVerificationStatus = typeof ProviderVerificationStatusSchema.Type

export const SpecialistVisitTypeSchema = makeLiteral(specialistVisitTypes)
export type SpecialistVisitType = typeof SpecialistVisitTypeSchema.Type

export const SymptomDurationSchema = makeLiteral(symptomDurations)
export type SymptomDuration = typeof SymptomDurationSchema.Type

export const ImagingTypeSchema = makeLiteral(imagingTypes)
export type ImagingType = typeof ImagingTypeSchema.Type

export const BodyAreaSchema = makeLiteral(bodyAreas)
export type BodyArea = typeof BodyAreaSchema.Type

export const FacilityTypeSchema = makeLiteral(facilityTypes)
export type FacilityType = typeof FacilityTypeSchema.Type

export const ViewerRoleSchema = Schema.Literal("patient", "provider")
export type ViewerRole = typeof ViewerRoleSchema.Type

export const SpecialistRequestDetailsSchema = Schema.Struct({
  visitType: SpecialistVisitTypeSchema,
  specialty: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(80)),
  symptomDuration: Schema.optional(SymptomDurationSchema),
  telehealthAccepted: Schema.optional(Schema.Boolean),
  additionalFlags: Schema.optional(
    Schema.Array(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(50))),
  ),
})
export type SpecialistRequestDetails = typeof SpecialistRequestDetailsSchema.Type

export const ImagingRequestDetailsSchema = Schema.Struct({
  imagingType: ImagingTypeSchema,
  bodyArea: BodyAreaSchema,
  preferredFacilityType: Schema.optional(FacilityTypeSchema),
  hasPriorImaging: Schema.optional(Schema.Boolean),
  additionalFlags: Schema.optional(
    Schema.Array(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(50))),
  ),
})
export type ImagingRequestDetails = typeof ImagingRequestDetailsSchema.Type

export const StructuredDetailsSchema = Schema.Union(
  SpecialistRequestDetailsSchema,
  ImagingRequestDetailsSchema,
)
export type StructuredDetails = typeof StructuredDetailsSchema.Type

export const CreateCareRequestInputSchema = Schema.Struct({
  category: ProviderCategorySchema,
  title: Schema.String.pipe(Schema.minLength(3), Schema.maxLength(120)),
  sanitizedSummary: Schema.String.pipe(Schema.minLength(10), Schema.maxLength(500)),
  targetBudgetCents: Schema.Number.pipe(Schema.int(), Schema.positive()),
  locationCity: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(80)),
  locationRegion: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(80)),
  preferredStartDate: Schema.String,
  preferredEndDate: Schema.String,
  urgency: UrgencySchema,
  serviceMode: ServiceModeSchema,
  details: StructuredDetailsSchema,
  expiresAt: Schema.String,
})
export type CreateCareRequestInput = typeof CreateCareRequestInputSchema.Type

export const BidInputSchema = Schema.Struct({
  requestId: Schema.String.pipe(Schema.minLength(1)),
  amountCents: Schema.Number.pipe(Schema.int(), Schema.positive()),
  availableDate: Schema.String,
  notes: Schema.optional(Schema.String.pipe(Schema.maxLength(280))),
})
export type BidInput = typeof BidInputSchema.Type

export const WithdrawBidInputSchema = Schema.Struct({
  requestId: Schema.String.pipe(Schema.minLength(1)),
})
export type WithdrawBidInput = typeof WithdrawBidInputSchema.Type

export const AcceptBidInputSchema = Schema.Struct({
  requestId: Schema.String.pipe(Schema.minLength(1)),
  bidId: Schema.String.pipe(Schema.minLength(1)),
})
export type AcceptBidInput = typeof AcceptBidInputSchema.Type

export const ViewerContextSchema = Schema.Struct({
  authUserId: Schema.String.pipe(Schema.minLength(1)),
  role: ViewerRoleSchema,
  patientId: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  providerId: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  email: Schema.optional(Schema.String),
})
export type ViewerContext = typeof ViewerContextSchema.Type

export const RequestSummarySchema = Schema.Struct({
  id: Schema.String,
  category: ProviderCategorySchema,
  title: Schema.String,
  sanitizedSummary: Schema.String,
  targetBudgetCents: Schema.Number,
  locationCity: Schema.String,
  locationRegion: Schema.String,
  preferredStartDate: Schema.String,
  preferredEndDate: Schema.String,
  urgency: UrgencySchema,
  serviceMode: ServiceModeSchema,
  status: RequestStatusSchema,
  expiresAt: Schema.String,
})
export type RequestSummary = typeof RequestSummarySchema.Type

export const ProviderLeaderboardBidSchema = Schema.Struct({
  bidId: Schema.String,
  position: Schema.Number.pipe(Schema.int(), Schema.positive()),
  amountCents: Schema.Number,
  availableDate: Schema.String,
  notes: Schema.optional(Schema.String),
  isYourBid: Schema.Boolean,
  status: BidStatusSchema,
})
export type ProviderLeaderboardBid = typeof ProviderLeaderboardBidSchema.Type

export const PatientLeaderboardBidSchema = Schema.Struct({
  bidId: Schema.String,
  position: Schema.Number.pipe(Schema.int(), Schema.positive()),
  amountCents: Schema.Number,
  availableDate: Schema.String,
  notes: Schema.optional(Schema.String),
  providerId: Schema.String,
  providerDisplayName: Schema.String,
  providerRating: Schema.optional(Schema.Number),
  providerVerificationStatus: ProviderVerificationStatusSchema,
  status: BidStatusSchema,
})
export type PatientLeaderboardBid = typeof PatientLeaderboardBidSchema.Type

export const RoomEventTypeSchema = makeLiteral(requestEventTypes)
export type RoomEventType = typeof RoomEventTypeSchema.Type

export const ConnectedPayloadSchema = Schema.Struct({
  request: RequestSummarySchema,
  viewer: ViewerContextSchema,
  leaderboard: Schema.Array(
    Schema.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema),
  ),
})

export const BidChangedPayloadSchema = Schema.Struct({
  requestStatus: RequestStatusSchema,
  leaderboard: Schema.Array(
    Schema.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema),
  ),
})

export const BidAcceptedPayloadSchema = Schema.Struct({
  requestStatus: RequestStatusSchema,
  acceptedBidId: Schema.String,
  leaderboard: Schema.Array(
    Schema.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema),
  ),
})

export const RequestExpiredPayloadSchema = Schema.Struct({
  requestStatus: RequestStatusSchema,
  leaderboard: Schema.Array(
    Schema.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema),
  ),
})

export const ErrorPayloadSchema = Schema.Struct({
  code: Schema.String,
  message: Schema.String,
})

export const RoomEventSchema = Schema.Struct({
  type: RoomEventTypeSchema,
  requestId: Schema.String,
  timestamp: Schema.String,
  payload: Schema.Unknown,
})
export type RoomEvent = typeof RoomEventSchema.Type
