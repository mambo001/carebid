import { type PropsWithChildren, useEffect, useState } from "react"

import { getCurrentAuthUser, observeAuthUser } from "../../lib/auth"
import { useSessionQuery } from "../../lib/queries"
import { useAppState } from "./app-state"

export function IdentityContextProvider({ children }: PropsWithChildren) {
  const [authResolved, setAuthResolved] = useState(false)
  const setSession = useAppState((state) => state.setSession)
  const neonUser = useAppState((state) => state.neonUser)
  const setNeonUser = useAppState((state) => state.setNeonUser)
  const sessionQuery = useSessionQuery(authResolved && Boolean(neonUser))

  useEffect(() => {
    if (sessionQuery.data?.session) {
      setSession(sessionQuery.data.session)
    }
  }, [sessionQuery.data, setSession])

  useEffect(() => {
    if (authResolved && !neonUser) {
      setSession(null)
    }
  }, [authResolved, neonUser, setSession])

  useEffect(() => {
    let cancelled = false

    setNeonUser(getCurrentAuthUser())

    const unsubscribe = observeAuthUser((user) => {
      if (!cancelled) {
        setNeonUser(user)
        setAuthResolved(true)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [setNeonUser])

  return children
}
