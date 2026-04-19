import * as S from "@effect/schema/Schema"

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
  S.Literal(...values)

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

export const ViewerRoleSchema = S.Literal("patient", "provider")
export type ViewerRole = typeof ViewerRoleSchema.Type

export const SpecialistRequestDetailsSchema = S.Struct({
  visitType: SpecialistVisitTypeSchema,
  specialty: S.String.pipe(S.minLength(2), S.maxLength(80)),
  symptomDuration: S.optional(SymptomDurationSchema),
  telehealthAccepted: S.optional(S.Boolean),
  additionalFlags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
})
export type SpecialistRequestDetails = typeof SpecialistRequestDetailsSchema.Type

export const ImagingRequestDetailsSchema = S.Struct({
  imagingType: ImagingTypeSchema,
  bodyArea: BodyAreaSchema,
  preferredFacilityType: S.optional(FacilityTypeSchema),
  hasPriorImaging: S.optional(S.Boolean),
  additionalFlags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
})
export type ImagingRequestDetails = typeof ImagingRequestDetailsSchema.Type

export const StructuredDetailsSchema = S.Union(
  SpecialistRequestDetailsSchema,
  ImagingRequestDetailsSchema,
)
export type StructuredDetails = typeof StructuredDetailsSchema.Type

export const CreateCareRequestInputSchema = S.Struct({
  category: ProviderCategorySchema,
  title: S.String.pipe(S.minLength(3), S.maxLength(120)),
  sanitizedSummary: S.String.pipe(S.minLength(10), S.maxLength(500)),
  targetBudgetCents: S.Number.pipe(S.int(), S.positive()),
  locationCity: S.String.pipe(S.minLength(2), S.maxLength(80)),
  locationRegion: S.String.pipe(S.minLength(2), S.maxLength(80)),
  preferredStartDate: S.String,
  preferredEndDate: S.String,
  urgency: UrgencySchema,
  serviceMode: ServiceModeSchema,
  details: StructuredDetailsSchema,
  expiresAt: S.String,
})
export type CreateCareRequestInput = typeof CreateCareRequestInputSchema.Type

export const BidInputSchema = S.Struct({
  requestId: S.String.pipe(S.minLength(1)),
  amountCents: S.Number.pipe(S.int(), S.positive()),
  availableDate: S.String,
  notes: S.optional(S.String.pipe(S.maxLength(280))),
})
export type BidInput = typeof BidInputSchema.Type

export const WithdrawBidInputSchema = S.Struct({
  requestId: S.String.pipe(S.minLength(1)),
})
export type WithdrawBidInput = typeof WithdrawBidInputSchema.Type

export const AcceptBidInputSchema = S.Struct({
  requestId: S.String.pipe(S.minLength(1)),
  bidId: S.String.pipe(S.minLength(1)),
})
export type AcceptBidInput = typeof AcceptBidInputSchema.Type

export const ViewerContextSchema = S.Struct({
  authUserId: S.String.pipe(S.minLength(1)),
  role: ViewerRoleSchema,
  patientId: S.optional(S.String.pipe(S.minLength(1))),
  providerId: S.optional(S.String.pipe(S.minLength(1))),
  email: S.optional(S.String),
})
export type ViewerContext = typeof ViewerContextSchema.Type

export const RequestSummarySchema = S.Struct({
  id: S.String,
  category: ProviderCategorySchema,
  title: S.String,
  sanitizedSummary: S.String,
  targetBudgetCents: S.Number,
  locationCity: S.String,
  locationRegion: S.String,
  preferredStartDate: S.String,
  preferredEndDate: S.String,
  urgency: UrgencySchema,
  serviceMode: ServiceModeSchema,
  status: RequestStatusSchema,
  expiresAt: S.String,
})
export type RequestSummary = typeof RequestSummarySchema.Type

export const ProviderLeaderboardBidSchema = S.Struct({
  bidId: S.String,
  position: S.Number.pipe(S.int(), S.positive()),
  amountCents: S.Number,
  availableDate: S.String,
  notes: S.optional(S.String),
  isYourBid: S.Boolean,
  status: BidStatusSchema,
})
export type ProviderLeaderboardBid = typeof ProviderLeaderboardBidSchema.Type

export const PatientLeaderboardBidSchema = S.Struct({
  bidId: S.String,
  position: S.Number.pipe(S.int(), S.positive()),
  amountCents: S.Number,
  availableDate: S.String,
  notes: S.optional(S.String),
  providerId: S.String,
  providerDisplayName: S.String,
  providerRating: S.optional(S.Number),
  providerVerificationStatus: ProviderVerificationStatusSchema,
  status: BidStatusSchema,
})
export type PatientLeaderboardBid = typeof PatientLeaderboardBidSchema.Type

export const RoomEventTypeSchema = makeLiteral(requestEventTypes)
export type RoomEventType = typeof RoomEventTypeSchema.Type

export const ConnectedPayloadSchema = S.Struct({
  request: RequestSummarySchema,
  viewer: ViewerContextSchema,
  leaderboard: S.Array(S.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema)),
})

export const BidChangedPayloadSchema = S.Struct({
  requestStatus: RequestStatusSchema,
  leaderboard: S.Array(S.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema)),
})

export const BidAcceptedPayloadSchema = S.Struct({
  requestStatus: RequestStatusSchema,
  acceptedBidId: S.String,
  leaderboard: S.Array(S.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema)),
})

export const RequestExpiredPayloadSchema = S.Struct({
  requestStatus: RequestStatusSchema,
  leaderboard: S.Array(S.Union(PatientLeaderboardBidSchema, ProviderLeaderboardBidSchema)),
})

export const ErrorPayloadSchema = S.Struct({
  code: S.String,
  message: S.String,
})

export const RoomEventSchema = S.Struct({
  type: RoomEventTypeSchema,
  requestId: S.String,
  timestamp: S.String,
  payload: S.Unknown,
})
export type RoomEvent = typeof RoomEventSchema.Type
