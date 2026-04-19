import { describe, expect, it } from "vitest"
import { Effect } from "effect"

import { RoomGateway } from "../../../domain/ports/room-gateway"
import { InMemoryRoomGatewayLayer } from "../../../test/room-gateway"
import { placeBidCommand } from "./place-bid"
import { acceptBidCommand } from "./accept-bid"

const layer = InMemoryRoomGatewayLayer

const run = <A, E>(effect: Effect.Effect<A, E, RoomGateway>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("acceptBidCommand", () => {
  it("accepts a bid and transitions room to awarded", async () => {
    const state = await run(
      Effect.gen(function* () {
        const placed = yield* placeBidCommand({
          requestId: "req-accept-001",
          providerId: "pro-1",
          providerDisplayName: "Dr. Accept",
          amount: 200000,
          availableDate: "2026-05-01",
        })
        const bidId = placed.bids[0].bidId
        return yield* acceptBidCommand({
          requestId: "req-accept-001",
          bidId,
        })
      }),
    )
    expect(state.status).toBe("awarded")
    expect(state.awardedBidId).toBeDefined()
  })

  it("fails on a non-open room", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const gateway = yield* RoomGateway
          yield* gateway.getRoomState("req-closed-a", "awarded")
          return yield* acceptBidCommand({
            requestId: "req-closed-a",
            bidId: "bid-fake",
          })
        }),
        layer,
      ),
    )
    expect(exit._tag).toBe("Failure")
  })
})
