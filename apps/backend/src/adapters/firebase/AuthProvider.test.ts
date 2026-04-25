import { describe, expect, it } from "@effect/vitest"

import { profileRowsFromIdentity } from "./AuthProvider"

describe("profileRowsFromIdentity", () => {
  it("creates default patient and provider rows for an authenticated Firebase user", () => {
    const rows = profileRowsFromIdentity({
      userId: "firebase-user-1",
      email: "clinician@example.test",
    })

    expect(rows.patient).toEqual({
      id: "firebase-user-1",
      authUserId: "firebase-user-1",
      email: "clinician@example.test",
      displayName: "clinician",
      locationCity: "",
      locationRegion: "",
    })
    expect(rows.provider).toEqual({
      id: "firebase-user-1",
      authUserId: "firebase-user-1",
      email: "clinician@example.test",
      displayName: "clinician",
      licenseRegion: null,
      verificationStatus: "verified",
      verificationMode: "demo_auto",
    })
    expect(rows.providerCategory).toEqual({
      providerId: "firebase-user-1",
      category: "imaging",
    })
  })
})
