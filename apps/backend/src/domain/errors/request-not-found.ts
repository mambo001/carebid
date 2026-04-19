import { Data } from "effect"

export class RequestNotFoundError extends Data.TaggedError("RequestNotFoundError")<{
  requestId: string
}> {}
