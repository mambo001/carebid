import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RoomGateway } from "../../../domain/ports/room-gateway"
import { InMemoryRoomGatewayLayer } from "../../../test/room-gateway"
import { placeBidCommand } from "./place-bid"
import { withdrawBidCommand } from "./withdraw-bid"

const layer = InMemoryRoomGatewayLayer

const run = <A, E>(effect: Effect.Effect<A, E, RoomGateway>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("withdrawBidCommand", () => {
  it("withdraws a bid", async () => {
    const state = await run(
      Effect.gen(function* () {
        yield* placeBidCommand({
          requestId: "req-withdraw-001",
          providerId: "pro-1",
          providerDisplayName: "Dr. Test",
          amountCents: 150000,
          availableDate: "2026-05-01",
        })
        return yield* withdrawBidCommand({
          requestId: "req-withdraw-001",
          providerId: "pro-1",
        })
      }),
    )
    expect(state.bids[0].status).toBe("withdrawn")
  })

  it("fails on a non-open room", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const gateway = yield* RoomGateway
          yield* gateway.getRoomState("req-closed-w", "expired")
          return yield* withdrawBidCommand({
            requestId: "req-closed-w",
            providerId: "pro-1",
          })
        }),
        layer,
      ),
    )
    expect(exit._tag).toBe("Failure")
  })
})
