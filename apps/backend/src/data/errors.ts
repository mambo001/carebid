import { Schema } from "@effect/schema"
import { UserId, RequestId, BidId } from "./branded"

export class RequestNotFound extends Schema.TaggedErrorClass("RequestNotFound")(
  "RequestNotFound",
  { requestId: RequestId }
) {}

export class NotRequestOwner extends Schema.TaggedErrorClass("NotRequestOwner")(
  "NotRequestOwner",
  { requestId: RequestId, userId: UserId }
) {}

export class RequestNotOpen extends Schema.TaggedErrorClass("RequestNotOpen")(
  "RequestNotOpen",
  { requestId: RequestId, status: Schema.String }
) {}

export class BidNotFound extends Schema.TaggedErrorClass("BidNotFound")(
  "BidNotFound",
  { bidId: BidId }
) {}

export class InvalidAmount extends Schema.TaggedErrorClass("InvalidAmount")(
  "InvalidAmount",
  { amount: Schema.Number, reason: Schema.String }
) {}

export class Unauthorized extends Schema.TaggedErrorClass("Unauthorized")(
  "Unauthorized",
  { message: Schema.String }
) {}

export class DatabaseError extends Schema.TaggedErrorClass("DatabaseError")(
  "DatabaseError",
  { cause: Schema.Unknown }
) {}

export class RedisError extends Schema.TaggedErrorClass("RedisError")(
  "RedisError",
  { cause: Schema.Unknown }
) {}
