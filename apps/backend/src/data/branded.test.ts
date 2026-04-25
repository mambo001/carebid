import { expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { Money } from "./branded"
import * as Schema from "@effect/schema/Schema"

it.effect("should create valid Money", () =>
  Effect.gen(function* () {
    const result = yield* Schema.decodeUnknownEffect(Money)(100)
    expect(result).toBe(100)
  })
)

it.effect("should reject negative Money", () =>
  Effect.gen(function* () {
    const result = yield* Schema.decodeUnknownEffect(Money)(-100).pipe(
      Effect.either
    )
    expect(result._tag).toBe("Left")
  })
)
