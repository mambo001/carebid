import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

describe("apps/web Dockerfile", () => {
  it("copies the api workspace manifest before bun install", () => {
    const dockerfilePath = resolve(import.meta.dirname, "../../../web/Dockerfile")
    const dockerfile = readFileSync(dockerfilePath, "utf8")

    const installStep = dockerfile.indexOf("RUN bun install --frozen-lockfile")
    const apiManifestCopy = dockerfile.indexOf(
      "COPY packages/api/package.json packages/api/package.json",
    )

    expect(apiManifestCopy).toBeGreaterThanOrEqual(0)
    expect(apiManifestCopy).toBeLessThan(installStep)
  })
})
