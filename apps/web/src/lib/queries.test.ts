import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"

describe("query exports", () => {
  it("does not expose role switching as product state", () => {
    const source = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")

    expect(source).not.toContain("useSwitchRoleMutation")
  })
})
