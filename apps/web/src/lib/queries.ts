import { useQuery } from "@tanstack/react-query"

import { api } from "./api"

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
