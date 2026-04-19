import { Data } from "effect"

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message?: string
}> {}

export class RequestNotFoundError extends Data.TaggedError("RequestNotFoundError")<{
  message?: string
}> {}

export class SessionError extends Data.TaggedError("SessionError")<{
  message?: string
}> {}
