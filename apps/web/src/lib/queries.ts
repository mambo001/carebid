import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "./api"
import type {
  CreateCareRequestInput,
  PatientOnboardingInput,
  ProviderOnboardingInput,
  ViewerRole,
} from "@carebid/shared"

export const requestKeys = {
  all: ["requests"] as const,
  room: (requestId: string) => ["requests", requestId, "room"] as const,
  session: ["session"] as const,
}

export const useRequestsQuery = () =>
  useQuery({
    queryKey: requestKeys.all,
    queryFn: api.getRequests,
  })

export const useRoomSnapshotQuery = (requestId: string) =>
  useQuery({
    queryKey: requestKeys.room(requestId),
    queryFn: () => api.getRoomSnapshot(requestId),
    enabled: Boolean(requestId),
  })

export const useSessionQuery = () =>
  useQuery({
    queryKey: requestKeys.session,
    queryFn: api.getSession,
  })

export const useSwitchRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (role: ViewerRole | undefined) => api.switchRole(role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.session })
    },
  })
}

export const usePatientOnboardingMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PatientOnboardingInput) => api.onboardPatient(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.session })
    },
  })
}

export const useProviderOnboardingMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProviderOnboardingInput) => api.onboardProvider(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.session })
    },
  })
}

export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCareRequestInput) => api.createRequest(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}
