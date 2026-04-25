import { Schema } from "effect"
import { UserId, RequestId, BidId } from "./branded"

export class RequestNotFound extends Schema.TaggedError<RequestNotFound>("RequestNotFound")(
  "RequestNotFound",
  { requestId: RequestId }
) {}

export class NotRequestOwner extends Schema.TaggedError<NotRequestOwner>("NotRequestOwner")(
  "NotRequestOwner",
  { requestId: RequestId, userId: UserId }
) {}

export class RequestNotOpen extends Schema.TaggedError<RequestNotOpen>("RequestNotOpen")(
  "RequestNotOpen",
  { requestId: RequestId, status: Schema.String }
) {}

export class BidNotFound extends Schema.TaggedError<BidNotFound>("BidNotFound")(
  "BidNotFound",
  { bidId: BidId }
) {}

export class InvalidAmount extends Schema.TaggedError<InvalidAmount>("InvalidAmount")(
  "InvalidAmount",
  { amount: Schema.Number, reason: Schema.String }
) {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>("Unauthorized")(
  "Unauthorized",
  { message: Schema.String }
) {}

export class DatabaseError extends Schema.TaggedError<DatabaseError>("DatabaseError")(
  "DatabaseError",
  { cause: Schema.Unknown }
) {}

export class RedisError extends Schema.TaggedError<RedisError>("RedisError")(
  "RedisError",
  { cause: Schema.Unknown }
) {}
