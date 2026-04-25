import { expect, it } from "@effect/vitest"
import { Effect, Either } from "effect"
import { Money } from "./branded"
import { Schema } from "effect"

it.effect("should create valid Money", () =>
  Effect.gen(function* () {
    const result = yield* Schema.decodeUnknown(Money)(100)
    expect(result).toBe(100)
  })
)

it.effect("should reject negative Money", () =>
  Effect.gen(function* () {
    const result = yield* Schema.decodeUnknown(Money)(-100).pipe(
      Effect.either
    )
    expect(Either.isLeft(result)).toBe(true)
  })
)
