import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "./api"
import type {
  AcceptBidInput,
  BidInput,
  CreateCareRequestInput,
  PatientOnboardingInput,
  ProviderOnboardingInput,
  WithdrawBidInput,
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

export const useSessionQuery = (enabled = true) =>
  useQuery({
    queryKey: requestKeys.session,
    queryFn: api.getSession,
    enabled,
  })

export const useSwitchRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (role: ViewerRole | undefined) => api.switchRole(role),
    onSuccess: (data) => {
      queryClient.setQueryData(requestKeys.session, data)
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

export const useOpenRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId: string) => api.openRequest(requestId),
    onSuccess: async (_, requestId) => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.all })
      await queryClient.invalidateQueries({ queryKey: requestKeys.room(requestId) })
    },
  })
}

export const usePlaceBidMutation = (requestId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BidInput) => api.placeBid(requestId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.room(requestId) })
    },
  })
}

export const useWithdrawBidMutation = (requestId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: WithdrawBidInput) => api.withdrawBid(requestId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.room(requestId) })
    },
  })
}

export const useAcceptBidMutation = (requestId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AcceptBidInput) => api.acceptBid(requestId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.room(requestId) })
      await queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

export const useExpireRequestMutation = (requestId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.expireRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.room(requestId) })
      await queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}
