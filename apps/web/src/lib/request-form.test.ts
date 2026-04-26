import { describe, expect, it } from "bun:test"

import { createInitialRequestValues } from "./request-form"

describe("createInitialRequestValues", () => {
  it("only initializes fields supported by the current backend create request endpoint", () => {
    expect(Object.keys(createInitialRequestValues()).sort()).toEqual([
      "category",
      "sanitizedSummary",
      "title",
    ])
  })
})
