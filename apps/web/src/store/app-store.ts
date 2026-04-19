import { create } from "zustand"

import type { AppSession } from "@carebid/shared"

type AppRole = "patient" | "provider" | null

type AppState = {
  activeRole: AppRole
  lastVisitedRequestId: string | null
  session: AppSession | null
  setActiveRole: (role: AppRole) => void
  setLastVisitedRequestId: (requestId: string | null) => void
  setSession: (session: AppSession | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeRole: null,
  lastVisitedRequestId: null,
  session: null,
  setActiveRole: (role) => set({ activeRole: role }),
  setLastVisitedRequestId: (requestId) => set({ lastVisitedRequestId: requestId }),
  setSession: (session) => set({ session, activeRole: session?.role ?? null }),
}))
