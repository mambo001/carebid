import { type PropsWithChildren, useEffect } from "react"

import { authClient } from "../../lib/auth"
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

    const syncNeonUser = async () => {
      try {
        const result = await authClient.getSession()
        if (!cancelled && result.data?.user) {
          setNeonUser({
            id: result.data.user.id,
            email: result.data.user.email,
            name: result.data.user.name,
          })
        }
      } catch {
        if (!cancelled) {
          setNeonUser(null)
        }
      }
    }

    syncNeonUser()
    return () => { cancelled = true }
  }, [setNeonUser])

  return children
}
