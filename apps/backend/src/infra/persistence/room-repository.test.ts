import { describe, expect, it } from "bun:test"

import { SessionError } from "../../domain/errors"
import { resolveProviderForActor } from "./room-repository"

describe("resolveProviderForActor", () => {
  it("returns the persisted provider for the authenticated user", async () => {
    const provider = await resolveProviderForActor(
      {
        provider: {
          findUnique: async () => ({
            id: "provider-123",
            displayName: "Demo Provider",
          }),
        },
      } as never,
      "demo-provider-001",
    )

    expect(provider).toEqual({
      id: "provider-123",
      displayName: "Demo Provider",
    })
  })

  it("fails when the authenticated user has no provider profile", async () => {
    expect.assertions(2)

    try {
      await resolveProviderForActor(
        {
          provider: {
            findUnique: async () => null,
          },
        } as never,
        "missing-provider",
      )
    } catch (error) {
      expect(error).toBeInstanceOf(SessionError)
      expect((error as SessionError).message).toContain("Provider profile required before bidding")
    }
  })
})
