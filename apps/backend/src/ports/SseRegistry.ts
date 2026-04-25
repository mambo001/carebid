import { Context, Effect, Queue } from "effect"
import { RequestId } from "../data/branded"

export class SseRegistry extends Context.Tag("@carebid/SseRegistry")<
  SseRegistry,
  {
    readonly add: (requestId: RequestId, queue: Queue.Queue<string>) => Effect.Effect<Effect.Effect<void>>
    readonly remove: (requestId: RequestId, queue: Queue.Queue<string>) => Effect.Effect<void>
    readonly broadcast: (requestId: RequestId, message: string) => Effect.Effect<void>
    readonly hasSubscribers: (requestId: RequestId) => Effect.Effect<boolean>
  }
>() {}
