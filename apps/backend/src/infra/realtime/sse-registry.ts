import { Effect, Layer, Queue, Ref } from "effect"

import { SseRegistry } from "../../domain/ports/sse-registry"

type Rooms = Map<string, Set<Queue.Queue<string>>>

export const LiveSseRegistryLayer = Layer.effect(
  SseRegistry,
  Effect.gen(function* () {
    const rooms = yield* Ref.make<Rooms>(new Map())

    const add = (roomId: string, queue: Queue.Queue<string>) =>
      Ref.update(rooms, (current) => {
        const next = new Map(current)
        const clients = new Set(next.get(roomId) ?? [])
        clients.add(queue)
        next.set(roomId, clients)
        return next
      }).pipe(
        Effect.map(() =>
          Effect.gen(function* () {
            yield* Queue.shutdown(queue)
            yield* Ref.update(rooms, (current) => {
              const next = new Map(current)
              const clients = new Set(next.get(roomId) ?? [])
              clients.delete(queue)
              if (clients.size === 0) {
                next.delete(roomId)
              } else {
                next.set(roomId, clients)
              }
              return next
            })
          }),
        ),
      )

    const broadcast = (roomId: string, payload: string) =>
      Ref.get(rooms).pipe(
        Effect.flatMap((current) =>
          Effect.forEach(current.get(roomId) ?? [], (queue) => Queue.offer(queue, payload), { discard: true }),
        ),
      )

    const hasSubscribers = (roomId: string) =>
      Ref.get(rooms).pipe(Effect.map((current) => (current.get(roomId)?.size ?? 0) > 0))

    return { add, broadcast, hasSubscribers }
  }),
)
