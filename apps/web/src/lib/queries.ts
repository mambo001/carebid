import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "./api"
import type { AcceptBidInput, BidInput, CreateRequestInput } from "./api"

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

export const useOpenRequestsQuery = () =>
  useQuery({
    queryKey: [...requestKeys.all, "open"] as const,
    queryFn: api.getOpenRequests,
    refetchInterval: 2_000,
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

export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateRequestInput) => api.createRequest(input),
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
      await queryClient.invalidateQueries({ queryKey: [...requestKeys.all, "open"] })
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
      await queryClient.invalidateQueries({ queryKey: [...requestKeys.all, "open"] })
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
      await queryClient.invalidateQueries({ queryKey: [...requestKeys.all, "open"] })
    },
  })
}
