import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { createRoomStreamUrl, decodeRoomMessage } from "./api"
import { getAuthToken } from "./auth"
import { requestKeys } from "./queries"

export const useRoomSocket = (requestId: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!requestId) {
      return
    }

    let stream: EventSource | null = null
    let closed = false

    void getAuthToken().then((token) => {
      if (closed) {
        return
      }

      if (!token) {
        return
      }

      stream = new EventSource(createRoomStreamUrl(requestId, token))

      stream.addEventListener("message", (event) => {
        const message = decodeRoomMessage(String(event.data))

        if ("request" in message) {
          queryClient.setQueryData(requestKeys.room(requestId), message)
        }
      })
    })

    return () => {
      closed = true
      stream?.close()
    }
  }, [queryClient, requestId])
}
