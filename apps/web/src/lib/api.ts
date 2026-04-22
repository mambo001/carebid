import * as Schema from "@effect/schema/Schema"

import {
  AcceptBidInputSchema,
  BidInputSchema,
  BidMutationResponseSchema,
  PatientOnboardingInputSchema,
  PatientOnboardingResponseSchema,
  ProviderOnboardingInputSchema,
  ProviderOnboardingResponseSchema,
  CreateCareRequestInputSchema,
  CreateCareRequestResponseSchema,
  RequestListResponseSchema,
  RequestResolutionResponseSchema,
  RequestSummaryResponseSchema,
  RequestRoomSnapshotSchema,
  RoomSnapshotMessageSchema,
  SessionResponseSchema,
  WithdrawBidInputSchema,
  ViewerRoleSchema,
} from "@carebid/shared"

import type {
  AcceptBidInput,
  BidInput,
  CreateCareRequestInput,
  PatientOnboardingInput,
  ProviderOnboardingInput,
  WithdrawBidInput,
  ViewerRole,
} from "@carebid/shared"

import { getAuthToken, setStoredAuthToken } from "./auth"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787"

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const authedFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const headers = { ...init?.headers, ...(await authHeaders()) }
  const response = await fetch(url, { ...init, headers })

  if (response.status === 401) {
    setStoredAuthToken(null)
  }

  return response
}

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
    const response = await authedFetch(`${apiBaseUrl}/api/requests`)

    return decodeJson(RequestListResponseSchema, response)
  },

  async getSession() {
    const response = await authedFetch(`${apiBaseUrl}/api/session`)

    return decodeJson(SessionResponseSchema, response)
  },

  async switchRole(role: ViewerRole | undefined) {
    const response = await authedFetch(`${apiBaseUrl}/api/session/role`, {
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
    const response = await authedFetch(`${apiBaseUrl}/api/onboarding/patient`, {
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
    const response = await authedFetch(`${apiBaseUrl}/api/onboarding/provider`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(ProviderOnboardingResponseSchema, response)
  },

  async getRoomSnapshot(requestId: string) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/room`)

    return decodeJson(RequestRoomSnapshotSchema, response)
  },

  async placeBid(requestId: string, input: BidInput) {
    const payload = Schema.decodeUnknownSync(BidInputSchema)(input)
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/bids`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(BidMutationResponseSchema, response)
  },

  async withdrawBid(requestId: string, input: WithdrawBidInput) {
    const payload = Schema.decodeUnknownSync(WithdrawBidInputSchema)(input)
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/bids/withdraw`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(BidMutationResponseSchema, response)
  },

  async acceptBid(requestId: string, input: AcceptBidInput) {
    const payload = Schema.decodeUnknownSync(AcceptBidInputSchema)(input)
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/bids/accept`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(RequestResolutionResponseSchema, response)
  },

  async expireRequest(requestId: string) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/expire`, {
      method: "POST",
    })

    return decodeJson(RequestResolutionResponseSchema, response)
  },

  async createRequest(input: CreateCareRequestInput) {
    const payload = Schema.decodeUnknownSync(CreateCareRequestInputSchema)(input)
    const response = await authedFetch(`${apiBaseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return decodeJson(CreateCareRequestResponseSchema, response)
  },

  async openRequest(requestId: string) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/open`, {
      method: "POST",
    })

    return decodeJson(RequestSummaryResponseSchema, response)
  },
}

export const decodeRoomMessage = (message: string) =>
  Schema.decodeUnknownSync(RoomSnapshotMessageSchema)(JSON.parse(message))

export const createRoomStreamUrl = (requestId: string, token: string) => {
  const url = new URL(`${apiBaseUrl}/api/requests/${requestId}/stream`)
  url.searchParams.set("token", token)
  return url.toString()
}
