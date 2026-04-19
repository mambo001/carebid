import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { api, decodeRoomMessage } from "./api"
import { requestKeys } from "./queries"

export const useRoomSocket = (requestId: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!requestId) {
      return
    }

    let socket: WebSocket | null = null
    let closed = false

    void api.getRoomConnection(requestId).then(({ websocketUrl }) => {
      if (closed) {
        return
      }

      socket = new WebSocket(websocketUrl)

      socket.addEventListener("message", (event) => {
        const message = decodeRoomMessage(String(event.data))

        queryClient.setQueryData(requestKeys.room(requestId), message.snapshot)
      })
    })

    return () => {
      closed = true
      socket?.close()
    }
  }, [queryClient, requestId])
}
