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

export class RoomNotOpenError extends Data.TaggedError("RoomNotOpenError")<{
  message?: string
}> {}

export class BidNotFoundError extends Data.TaggedError("BidNotFoundError")<{
  message?: string
}> {}
