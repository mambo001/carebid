import { type PropsWithChildren, useEffect } from "react"

import { getCurrentAuthUser, observeAuthUser } from "../../lib/auth"
import { useSessionQuery } from "../../lib/queries"
import { useAppState } from "./app-state"

export function IdentityContextProvider({ children }: PropsWithChildren) {
  const sessionQuery = useSessionQuery()
  const setSession = useAppState((state) => state.setSession)
  const setNeonUser = useAppState((state) => state.setNeonUser)

  useEffect(() => {
    if (sessionQuery.data?.session) {
      setSession(sessionQuery.data.session)
    }
  }, [sessionQuery.data, setSession])

  useEffect(() => {
    let cancelled = false

    setNeonUser(getCurrentAuthUser())

    const unsubscribe = observeAuthUser((user) => {
      if (!cancelled) {
        setNeonUser(user)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [setNeonUser])

  return children
}
