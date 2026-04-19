import * as Schema from "@effect/schema/Schema"

import {
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
  CreateCareRequestInputSchema,
  CreateCareRequestResponseSchema,
  RequestListResponseSchema,
  RequestRoomSnapshotSchema,
  SessionResponseSchema,
  ViewerRoleSchema,
} from "@carebid/shared"

import type {
  CreateCareRequestInput,
  PatientOnboardingInput,
  ProviderOnboardingInput,
  ViewerRole,
} from "@carebid/shared"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787"

const decodeJson = async <A, I>(
  schema: Schema.Schema<A, I>,
  response: Response,
) => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const json = await response.json()

  return Schema.decodeUnknownPromise(schema)(json)
}

export const api = {
  async getRequests() {
    const response = await fetch(`${apiBaseUrl}/api/requests`)

    return decodeJson(RequestListResponseSchema, response)
  },

  async getSession() {
    const response = await fetch(`${apiBaseUrl}/api/session`)

    return decodeJson(SessionResponseSchema, response)
  },

  async switchRole(role: ViewerRole | undefined) {
    const response = await fetch(`${apiBaseUrl}/api/session/role`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        role: role === undefined ? undefined : Schema.decodeUnknownSync(ViewerRoleSchema)(role),
      }),
    })

    return decodeJson(SessionResponseSchema, response)
  },

  async onboardPatient(input: PatientOnboardingInput) {
    const payload = Schema.decodeUnknownSync(PatientOnboardingInputSchema)(input)
    const response = await fetch(`${apiBaseUrl}/api/onboarding/patient`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(PatientOnboardingResponseSchema, response)
  },

  async onboardProvider(input: ProviderOnboardingInput) {
    const payload = Schema.decodeUnknownSync(ProviderOnboardingInputSchema)(input)
    const response = await fetch(`${apiBaseUrl}/api/onboarding/provider`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(ProviderOnboardingResponseSchema, response)
  },

  async getRoomSnapshot(requestId: string) {
    const response = await fetch(`${apiBaseUrl}/api/requests/${requestId}/room`)

    return decodeJson(RequestRoomSnapshotSchema, response)
  },

  async createRequest(input: CreateCareRequestInput) {
    const payload = Schema.decodeUnknownSync(CreateCareRequestInputSchema)(input)
    const response = await fetch(`${apiBaseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(CreateCareRequestResponseSchema, response)
  },
}
