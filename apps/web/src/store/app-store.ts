import { create } from "zustand"

type AppRole = "patient" | "provider" | null

type AppState = {
  activeRole: AppRole
  lastVisitedRequestId: string | null
  setActiveRole: (role: AppRole) => void
  setLastVisitedRequestId: (requestId: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeRole: null,
  lastVisitedRequestId: null,
  setActiveRole: (role) => set({ activeRole: role }),
  setLastVisitedRequestId: (requestId) => set({ lastVisitedRequestId: requestId }),
}))
