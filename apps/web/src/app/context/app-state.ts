import { create } from "zustand"

import type { AppSession } from "../../lib/api"

type AuthUser = {
  id: string
  email: string
  name: string
} | null

type AppState = {
  lastVisitedRequestId: string | null
  session: AppSession | null
  authUser: AuthUser
  setLastVisitedRequestId: (requestId: string | null) => void
  setSession: (session: AppSession | null) => void
  setAuthUser: (user: AuthUser) => void
}

export const useAppState = create<AppState>((set) => ({
  lastVisitedRequestId: null,
  session: null,
  authUser: null,
  setLastVisitedRequestId: (requestId) => set({ lastVisitedRequestId: requestId }),
  setSession: (session) => set({ session }),
  setAuthUser: (user) => set({ authUser: user }),
}))
