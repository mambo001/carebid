import { describe, expect, it } from "vitest"
import { Effect, Layer } from "effect"

import type { RoomState } from "../../../domain/entities"
import type { DatabaseError, RoomNotOpenError } from "../../../domain/errors"
import { RoomGateway } from "../../../domain/ports/room-gateway"
import { InMemoryRoomGatewayLayer } from "../../../test/room-gateway"
import { placeBidCommand } from "./place-bid"

const layer = InMemoryRoomGatewayLayer

const run = <A, E>(effect: Effect.Effect<A, E, RoomGateway>) =>
  Effect.runPromise(Effect.provide(effect, layer))

describe("placeBidCommand", () => {
  it("places a bid on an open room", async () => {
    const state = await run(
      placeBidCommand({
        requestId: "req-test-bid-001",
        providerId: "pro-1",
        providerDisplayName: "Dr. Test",
        amountCents: 150000,
        availableDate: "2026-05-01",
      }),
    )
    expect(state.bids.length).toBe(1)
    expect(state.bids[0].amountCents).toBe(150000)
    expect(state.bids[0].status).toBe("active")
  })

  it("updates an existing bid from the same provider", async () => {
    const state = await run(
      Effect.gen(function* () {
        yield* placeBidCommand({
          requestId: "req-test-bid-002",
          providerId: "pro-1",
          providerDisplayName: "Dr. Test",
          amountCents: 150000,
          availableDate: "2026-05-01",
        })
        return yield* placeBidCommand({
          requestId: "req-test-bid-002",
          providerId: "pro-1",
          providerDisplayName: "Dr. Test",
          amountCents: 120000,
          availableDate: "2026-05-02",
        })
      }),
    )
    expect(state.bids.length).toBe(1)
    expect(state.bids[0].amountCents).toBe(120000)
  })

  it("fails on a non-open room", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.gen(function* () {
          const gateway = yield* RoomGateway
          yield* gateway.getRoomState("req-closed", "awarded")
          return yield* placeBidCommand({
            requestId: "req-closed",
            providerId: "pro-1",
            providerDisplayName: "Dr. Test",
            amountCents: 100000,
            availableDate: "2026-05-01",
          })
        }),
        layer,
      ),
    )
    expect(exit._tag).toBe("Failure")
  })
})
