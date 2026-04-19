import { Context } from "effect"

import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

export type RequestRepository = {
  listRequests: () => Promise<RequestSummary[]>
  getRequest: (requestId: string) => Promise<RequestSummary | undefined>
  createRequest: (input: CreateCareRequestInput) => Promise<RequestSummary>
  openRequest: (requestId: string) => Promise<RequestSummary | undefined>
  markRequestAwarded: (requestId: string, bidId: string) => Promise<RequestSummary | undefined>
  markRequestExpired: (requestId: string) => Promise<RequestSummary | undefined>
}

export const RequestRepository = Context.GenericTag<RequestRepository>("@carebid/RequestRepository")
