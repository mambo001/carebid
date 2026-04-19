import type { CreateCareRequestInput } from "@carebid/shared"

export type RequestFormValues = CreateCareRequestInput

export const requestCategoryOptions = [
  { label: "Specialist consult", value: "specialist_consult" },
  { label: "Imaging", value: "imaging" },
] as const

export const urgencyOptions = [
  { label: "Routine", value: "routine" },
  { label: "Soon", value: "soon" },
  { label: "Urgent", value: "urgent" },
] as const

export const serviceModeOptions = [
  { label: "In person", value: "in_person" },
  { label: "Telehealth", value: "telehealth" },
  { label: "Either", value: "either" },
] as const

export const specialistVisitTypeOptions = [
  { label: "New issue", value: "new_issue" },
  { label: "Follow up", value: "follow_up" },
  { label: "Second opinion", value: "second_opinion" },
] as const

export const imagingTypeOptions = [
  { label: "X-ray", value: "xray" },
  { label: "Ultrasound", value: "ultrasound" },
  { label: "CT", value: "ct" },
  { label: "MRI", value: "mri" },
  { label: "Mammogram", value: "mammogram" },
  { label: "Other", value: "other" },
] as const

export const bodyAreaOptions = [
  { label: "Head", value: "head" },
  { label: "Neck", value: "neck" },
  { label: "Chest", value: "chest" },
  { label: "Abdomen", value: "abdomen" },
  { label: "Spine", value: "spine" },
  { label: "Upper limb", value: "upper_limb" },
  { label: "Lower limb", value: "lower_limb" },
  { label: "Pelvis", value: "pelvis" },
  { label: "General", value: "general" },
  { label: "Other", value: "other" },
] as const

export const createInitialRequestValues = (): RequestFormValues => ({
  category: "specialist_consult",
  title: "",
  sanitizedSummary: "",
  targetBudgetCents: 1500000,
  locationCity: "",
  locationRegion: "",
  preferredStartDate: "2026-04-24",
  preferredEndDate: "2026-04-30",
  urgency: "soon",
  serviceMode: "either",
  expiresAt: "2026-04-25T12:00",
  details: {
    visitType: "second_opinion",
    specialty: "Neurology",
    telehealthAccepted: true,
  },
})
