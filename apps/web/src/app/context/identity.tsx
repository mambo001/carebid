import { type PropsWithChildren, useEffect } from "react"

import { useSessionQuery } from "../../lib/queries"
import { useAppState } from "./app-state"

export function IdentityContextProvider({ children }: PropsWithChildren) {
  const sessionQuery = useSessionQuery()
  const setSession = useAppState((state) => state.setSession)

  useEffect(() => {
    if (sessionQuery.data?.session) {
      setSession(sessionQuery.data.session)
    }
  }, [sessionQuery.data, setSession])

  return children
}
