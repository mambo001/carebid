import { Effect, Layer, Ref, Queue } from "effect"
import { SseRegistry } from "../../ports/SseRegistry"
import { RequestId } from "../../data/branded"

export const make = Effect.gen(function* () {
  const store = yield* Ref.make(new Map<string, Set<Queue.Queue<string>>>())

  const add = (requestId: RequestId, queue: Queue.Queue<string>) =>
    Effect.gen(function* () {
      yield* Ref.update(store, (map) => {
        const newMap = new Map(map)
        const set = newMap.get(requestId) ?? new Set()
        set.add(queue)
        newMap.set(requestId, set)
        return newMap
      })

      return Effect.gen(function* () {
        yield* Ref.update(store, (map) => {
          const newMap = new Map(map)
          const set = newMap.get(requestId)
          if (set) {
            set.delete(queue)
            if (set.size === 0) newMap.delete(requestId)
          }
          return newMap
        })
      })
    })

  const remove = (requestId: RequestId, queue: Queue.Queue<string>) =>
    Ref.update(store, (map) => {
      const newMap = new Map(map)
      const set = newMap.get(requestId)
      if (set) {
        set.delete(queue)
        if (set.size === 0) newMap.delete(requestId)
      }
      return newMap
    })

  const broadcast = (requestId: RequestId, message: string) =>
    Ref.get(store).pipe(
      Effect.map((map) => map.get(requestId) ?? new Set()),
      Effect.flatMap((queues) =>
        Effect.forEach(queues, (q) => Queue.offer(q, message), { discard: true })
      )
    )

  const hasSubscribers = (requestId: RequestId) =>
    Ref.get(store).pipe(
      Effect.map((map) => (map.get(requestId)?.size ?? 0) > 0)
    )

  return SseRegistry.of({ add, remove, broadcast, hasSubscribers })
})

export const layer = Layer.effect(SseRegistry, make)
