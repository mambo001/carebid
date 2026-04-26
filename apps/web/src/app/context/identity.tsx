import { type PropsWithChildren, useEffect, useState } from "react"

import { getCurrentAuthUser, observeAuthUser } from "../../lib/auth"
import { useSessionQuery } from "../../lib/queries"
import { useAppState } from "./app-state"

export function IdentityContextProvider({ children }: PropsWithChildren) {
  const [authResolved, setAuthResolved] = useState(false)
  const setSession = useAppState((state) => state.setSession)
  const authUser = useAppState((state) => state.authUser)
  const setAuthUser = useAppState((state) => state.setAuthUser)
  const sessionQuery = useSessionQuery(authResolved && Boolean(authUser))

  useEffect(() => {
    if (sessionQuery.data?.session) {
      setSession(sessionQuery.data.session)
    }
  }, [sessionQuery.data, setSession])

  useEffect(() => {
    if (authResolved && !authUser) {
      setSession(null)
    }
  }, [authResolved, authUser, setSession])

  useEffect(() => {
    let cancelled = false

    setAuthUser(getCurrentAuthUser())

    const unsubscribe = observeAuthUser((user) => {
      if (!cancelled) {
        setAuthUser(user)
        setAuthResolved(true)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [setAuthUser])

  return children
}
