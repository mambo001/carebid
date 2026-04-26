import { describe, expect, it } from "bun:test"

import { useAppState } from "./app-state"

describe("app state", () => {
  it("stores auth user and session without deriving an active role", () => {
    useAppState.setState({ authUser: null, session: null, lastVisitedRequestId: null })

    useAppState.getState().setAuthUser({
      id: "firebase-user-1",
      email: "demo@example.test",
      name: "Demo",
    })
    useAppState.getState().setSession({
      mode: "authenticated",
      authUserId: "firebase-user-1",
      email: "demo@example.test",
      role: "provider",
    })

    expect(useAppState.getState().authUser?.id).toBe("firebase-user-1")
    expect(useAppState.getState().session?.role).toBe("provider")
    expect("activeRole" in useAppState.getState()).toBe(false)
  })
})
