import * as Schema from "@effect/schema/Schema"

import {
  CreateCareRequestInputSchema,
  CreateCareRequestResponseSchema,
  RequestListResponseSchema,
  RequestRoomSnapshotSchema,
} from "@carebid/shared"

import type { CreateCareRequestInput } from "@carebid/shared"

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
