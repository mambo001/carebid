import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

export const demoRequests: RequestSummary[] = [
  {
    id: "req-neuro-001",
    category: "specialist_consult",
    title: "Neurology second opinion",
    sanitizedSummary:
      "Recurring migraines for several months. Looking for a second opinion within two weeks.",
    targetBudgetCents: 1800000,
    locationCity: "Makati",
    locationRegion: "Metro Manila",
    preferredStartDate: "2026-04-24",
    preferredEndDate: "2026-05-03",
    urgency: "soon",
    serviceMode: "either",
    status: "open",
    expiresAt: "2026-04-25T12:00:00.000Z",
  },
  {
    id: "req-imaging-003",
    category: "imaging",
    title: "CT quote for chest imaging",
    sanitizedSummary:
      "Need chest CT pricing with earliest availability this week. Prefers a reputable imaging center.",
    targetBudgetCents: 950000,
    locationCity: "Taguig",
    locationRegion: "Metro Manila",
    preferredStartDate: "2026-04-21",
    preferredEndDate: "2026-04-27",
    urgency: "urgent",
    serviceMode: "in_person",
    status: "open",
    expiresAt: "2026-04-22T08:00:00.000Z",
  },
]

export const createDemoRequest = (input: CreateCareRequestInput): RequestSummary => {
  const item: RequestSummary = {
    id: `req-${crypto.randomUUID()}`,
    category: input.category,
    title: input.title,
    sanitizedSummary: input.sanitizedSummary,
    targetBudgetCents: input.targetBudgetCents,
    locationCity: input.locationCity,
    locationRegion: input.locationRegion,
    preferredStartDate: input.preferredStartDate,
    preferredEndDate: input.preferredEndDate,
    urgency: input.urgency,
    serviceMode: input.serviceMode,
    status: "draft",
    expiresAt: input.expiresAt,
  }

  demoRequests.unshift(item)

  return item
}
