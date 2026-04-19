import { Context, Effect } from "effect"

import type { CreateCareRequestInput, RequestSummary } from "@carebid/shared"

import { DatabaseError, RequestNotFoundError } from "../errors"

export interface RequestRepository {
  readonly listRequests: () => Effect.Effect<readonly RequestSummary[], DatabaseError>
  readonly getRequest: (requestId: string) => Effect.Effect<RequestSummary, RequestNotFoundError | DatabaseError>
  readonly createRequest: (input: CreateCareRequestInput) => Effect.Effect<RequestSummary, DatabaseError>
  readonly openRequest: (requestId: string) => Effect.Effect<RequestSummary, RequestNotFoundError | DatabaseError>
  readonly markRequestAwarded: (
    requestId: string,
    bidId: string,
  ) => Effect.Effect<RequestSummary, RequestNotFoundError | DatabaseError>
  readonly markRequestExpired: (
    requestId: string,
  ) => Effect.Effect<RequestSummary, RequestNotFoundError | DatabaseError>
}

export const RequestRepository = Context.GenericTag<RequestRepository>("@carebid/RequestRepository")
