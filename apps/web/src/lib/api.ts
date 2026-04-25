import * as Schema from "@effect/schema/Schema"

import { clearAuthSession, getAuthToken } from "./auth"

export type ViewerRole = "patient" | "provider"

export type AppSession = {
  readonly mode: "authenticated"
  readonly authUserId: string
  readonly email: string
  readonly role: ViewerRole
}

export type CreateRequestInput = {
  readonly title: string
  readonly description: string
  readonly category: string
}

export type BidInput = {
  readonly requestId: string
  readonly amount: number
  readonly availableDate: string
  readonly notes: string | null
}

export type AcceptBidInput = {
  readonly bidId: string
}

export type Bid = {
  readonly id: string
  readonly requestId: string
  readonly providerId: string
  readonly providerDisplayName: string
  readonly amount: number
  readonly availableDate: string
  readonly notes: string | null
  readonly status: "active" | "withdrawn" | "accepted"
  readonly createdAt: string
}

export type DraftRequest = {
  readonly _tag: "DraftRequest"
  readonly id: string
  readonly patientId: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly createdAt: string
}

export type OpenRequest = {
  readonly _tag: "OpenRequest"
  readonly id: string
  readonly patientId: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly bids: ReadonlyArray<Bid>
  readonly openedAt: string
}

export type AwardedRequest = {
  readonly _tag: "AwardedRequest"
  readonly id: string
  readonly patientId: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly bids: ReadonlyArray<Bid>
  readonly awardedBidId: string
  readonly awardedAt: string
}

export type CareRequest = DraftRequest | OpenRequest | AwardedRequest

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787"

const ViewerRoleSchema = Schema.Literal("patient", "provider")

const AppSessionSchema = Schema.Struct({
  mode: Schema.Literal("authenticated"),
  authUserId: Schema.String,
  email: Schema.String,
  role: ViewerRoleSchema,
})

const SessionResponseSchema = Schema.Struct({
  ok: Schema.Literal(true),
  session: AppSessionSchema,
})

const BidSchema = Schema.Struct({
  id: Schema.String,
  requestId: Schema.String,
  providerId: Schema.String,
  providerDisplayName: Schema.String,
  amount: Schema.Number,
  availableDate: Schema.String,
  notes: Schema.NullOr(Schema.String),
  status: Schema.Literal("active", "withdrawn", "accepted"),
  createdAt: Schema.String,
})

const DraftRequestSchema = Schema.Struct({
  _tag: Schema.Literal("DraftRequest"),
  id: Schema.String,
  patientId: Schema.String,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  createdAt: Schema.String,
})

const OpenRequestSchema = Schema.Struct({
  _tag: Schema.Literal("OpenRequest"),
  id: Schema.String,
  patientId: Schema.String,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  bids: Schema.Array(BidSchema),
  openedAt: Schema.String,
})

const AwardedRequestSchema = Schema.Struct({
  _tag: Schema.Literal("AwardedRequest"),
  id: Schema.String,
  patientId: Schema.String,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  bids: Schema.Array(BidSchema),
  awardedBidId: Schema.String,
  awardedAt: Schema.String,
})

const CareRequestSchema = Schema.Union(DraftRequestSchema, OpenRequestSchema, AwardedRequestSchema)

const RequestListResponseSchema = Schema.Struct({
  items: Schema.Array(CareRequestSchema),
})

const RequestResponseSchema = Schema.Struct({
  request: CareRequestSchema,
})

const BidResponseSchema = Schema.Struct({
  bid: BidSchema,
})

const ConnectedRoomMessageSchema = Schema.Struct({
  type: Schema.Literal("connected"),
})

const RoomUpdateMessageSchema = Schema.Struct({
  request: CareRequestSchema,
})

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const authedFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const headers = { ...init?.headers, ...(await authHeaders()) }
  const response = await fetch(url, { ...init, headers })

  if (response.status === 401) {
    await clearAuthSession()
  }

  return response
}

const decodeJson = async <A, I>(schema: Schema.Schema<A, I>, response: Response) => {
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

  async getOpenRequests() {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/open`)

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
      body: JSON.stringify({ role }),
    })

    return decodeJson(SessionResponseSchema, response)
  },

  async getRoomSnapshot(requestId: string) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/room`)

    return decodeJson(RequestResponseSchema, response)
  },

  async placeBid(requestId: string, input: BidInput) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/bids`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...input, requestId }),
    })

    return decodeJson(BidResponseSchema, response)
  },

  async acceptBid(requestId: string, input: AcceptBidInput) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/accept`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    })

    return decodeJson(RequestResponseSchema, response)
  },

  async createRequest(input: CreateRequestInput) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    })

    return decodeJson(RequestResponseSchema, response)
  },

  async openRequest(requestId: string) {
    const response = await authedFetch(`${apiBaseUrl}/api/requests/${requestId}/open`, {
      method: "POST",
    })

    return decodeJson(RequestResponseSchema, response)
  },
}

export const decodeRoomMessage = (message: string) => {
  const json = JSON.parse(message)
  const connected = Schema.decodeUnknownOption(ConnectedRoomMessageSchema)(json)

  if (connected._tag === "Some") {
    return connected.value
  }

  return Schema.decodeUnknownSync(RoomUpdateMessageSchema)(json)
}

export const createRoomStreamUrl = (requestId: string, token: string) => {
  const url = new URL(`${apiBaseUrl}/api/requests/${requestId}/stream`)
  url.searchParams.set("token", token)
  return url.toString()
}
