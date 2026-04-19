import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "./api"
import type { CreateCareRequestInput } from "@carebid/shared"

export const requestKeys = {
  all: ["requests"] as const,
  room: (requestId: string) => ["requests", requestId, "room"] as const,
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

export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCareRequestInput) => api.createRequest(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}
