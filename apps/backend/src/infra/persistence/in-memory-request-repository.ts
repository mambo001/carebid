import { Effect, Layer } from "effect"

import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

import { RequestNotFoundError } from "../../domain/errors"
import { RequestRepository } from "../../domain/ports/request-repository"

const seedRequests: RequestSummary[] = [
  {
    id: "req-neuro-001",
    category: "specialist_consult",
    title: "Neurology second opinion",
    sanitizedSummary:
      "Recurring migraines for several months. Looking for a second opinion within two weeks.",
    targetBudget: 1800000,
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
    targetBudget: 950000,
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

export const makeInMemoryRequestRepository = (): RequestRepository => {
  const store: RequestSummary[] = [...seedRequests]

  const findById = (requestId: string): RequestSummary | undefined =>
    store.find((r) => r.id === requestId)

  return {
    listRequests: () => Effect.succeed([...store]),

    getRequest: (requestId) => {
      const item = findById(requestId)
      return item
        ? Effect.succeed(item)
        : Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
    },

    createRequest: (_identity, input: CreateCareRequestInput) => {
      const item: RequestSummary = {
        id: `req-${crypto.randomUUID()}`,
        category: input.category,
        title: input.title,
        sanitizedSummary: input.sanitizedSummary,
        targetBudget: input.targetBudget,
        locationCity: input.locationCity,
        locationRegion: input.locationRegion,
        preferredStartDate: input.preferredStartDate,
        preferredEndDate: input.preferredEndDate,
        urgency: input.urgency,
        serviceMode: input.serviceMode,
        status: "draft",
        expiresAt: input.expiresAt,
      }
      store.unshift(item)
      return Effect.succeed(item)
    },

    openRequest: (requestId) => {
      const index = store.findIndex((r) => r.id === requestId)
      if (index === -1) {
        return Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }
      const next = { ...store[index], status: "open" as const }
      store[index] = next
      return Effect.succeed(next)
    },

    markRequestAwarded: (requestId, _bidId) => {
      const index = store.findIndex((r) => r.id === requestId)
      if (index === -1) {
        return Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }
      const next = { ...store[index], status: "awarded" as const }
      store[index] = next
      return Effect.succeed(next)
    },

    markRequestExpired: (requestId) => {
      const index = store.findIndex((r) => r.id === requestId)
      if (index === -1) {
        return Effect.fail(new RequestNotFoundError({ message: `Request ${requestId} not found` }))
      }
      const next = { ...store[index], status: "expired" as const }
      store[index] = next
      return Effect.succeed(next)
    },
  }
}

export const InMemoryRequestRepositoryLayer = Layer.sync(RequestRepository, makeInMemoryRequestRepository)
