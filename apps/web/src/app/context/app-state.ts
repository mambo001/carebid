import { create } from "zustand"

import type { AppSession } from "../../lib/api"

type AppRole = "patient" | "provider" | null

type NeonUser = {
  id: string
  email: string
  name: string
} | null

type AppState = {
  activeRole: AppRole
  lastVisitedRequestId: string | null
  session: AppSession | null
  neonUser: NeonUser
  setActiveRole: (role: AppRole) => void
  setLastVisitedRequestId: (requestId: string | null) => void
  setSession: (session: AppSession | null) => void
  setNeonUser: (user: NeonUser) => void
}

export const useAppState = create<AppState>((set) => ({
  activeRole: null,
  lastVisitedRequestId: null,
  session: null,
  neonUser: null,
  setActiveRole: (role) => set({ activeRole: role }),
  setLastVisitedRequestId: (requestId) => set({ lastVisitedRequestId: requestId }),
  setSession: (session) => set({ session, activeRole: session?.role ?? null }),
  setNeonUser: (user) => set({ neonUser: user }),
}))
