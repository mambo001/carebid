import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RoomGateway } from "../../../domain/ports/room-gateway"
import { InMemoryRoomGatewayLayer } from "../../../test/room-gateway"
import { expireRoomCommand } from "./expire-room"

const layer = InMemoryRoomGatewayLayer

const run = <A, E>(effect: Effect.Effect<A, E, RoomGateway>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("expireRoomCommand", () => {
  it("expires an open room", async () => {
    const state = await run(expireRoomCommand("req-expire-001"))
    expect(state.status).toBe("expired")
    expect(state.bids.every((b) => b.status === "withdrawn")).toBe(true)
  })

  it("fails on a non-open room", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const gateway = yield* RoomGateway
          yield* gateway.getRoomState("req-closed-e", "awarded")
          return yield* expireRoomCommand("req-closed-e")
        }),
        layer,
      ),
    )
    expect(exit._tag).toBe("Failure")
  })
})
