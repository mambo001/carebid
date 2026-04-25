import { describe, expect, it } from "@effect/vitest"

import { extractBearerToken, extractQueryToken } from "./auth"

describe("auth token extraction", () => {
  it("extracts bearer tokens from Authorization headers", () => {
    expect(extractBearerToken("Bearer header-token")).toBe("header-token")
  })

  it("extracts Firebase tokens from EventSource query params", () => {
    expect(extractQueryToken("http://localhost/api/requests/req_1/stream?token=query-token")).toBe("query-token")
  })
})
