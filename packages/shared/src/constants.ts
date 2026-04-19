export const appName = "CareBid"

export const providerCategories = ["specialist_consult", "imaging"] as const

export const requestStatuses = ["draft", "open", "awarded", "expired"] as const

export const bidStatuses = [
  "active",
  "withdrawn",
  "accepted",
  "rejected",
  "expired",
] as const

export const urgencyLevels = ["routine", "soon", "urgent"] as const

export const serviceModes = ["in_person", "telehealth", "either"] as const

export const providerVerificationModes = ["demo_auto"] as const

export const providerVerificationStatuses = ["verified"] as const

export const specialistVisitTypes = [
  "new_issue",
  "follow_up",
  "second_opinion",
] as const

export const symptomDurations = ["days", "weeks", "months", "chronic"] as const

export const imagingTypes = ["xray", "ultrasound", "ct", "mri", "mammogram", "other"] as const

export const bodyAreas = [
  "head",
  "neck",
  "chest",
  "abdomen",
  "spine",
  "upper_limb",
  "lower_limb",
  "pelvis",
  "general",
  "other",
] as const

export const facilityTypes = ["hospital", "imaging_center", "either"] as const

export const requestEventTypes = [
  "connected",
  "bid_placed",
  "bid_updated",
  "bid_withdrawn",
  "bid_accepted",
  "request_expired",
  "error",
] as const
