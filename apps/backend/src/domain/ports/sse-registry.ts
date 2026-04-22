import { Context, Effect, Queue } from "effect"

export interface SseRegistry {
  readonly add: (roomId: string, queue: Queue.Queue<string>) => Effect.Effect<Effect.Effect<void>>
  readonly broadcast: (roomId: string, payload: string) => Effect.Effect<void>
  readonly hasSubscribers: (roomId: string) => Effect.Effect<boolean>
}

export const SseRegistry = Context.GenericTag<SseRegistry>("@carebid/SseRegistry")