import { createAuthClient } from "@neondatabase/neon-js/auth"

const neonAuthUrl =
  import.meta.env.VITE_NEON_AUTH_URL ??
  "https://ep-green-morning-amhwk5kg.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth"

const authTokenStorageKey = "carebid.auth-token"

export const authClient = createAuthClient(neonAuthUrl)

export type AuthSession = {
  user: { id: string; email: string; name: string }
  session: { id: string; token: string }
}

export const setStoredAuthToken = (token: string | null) => {
  if (typeof window === "undefined") {
    return
  }

  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token)
    return
  }

  window.localStorage.removeItem(authTokenStorageKey)
}

const getStoredAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(authTokenStorageKey)
}

export const getAuthToken = async (): Promise<string | null> => {
  const storedToken = getStoredAuthToken()

  if (storedToken) {
    return storedToken
  }

  try {
    const result = await authClient.getSession()
    const token = result.data?.session?.token ?? null

    setStoredAuthToken(token)
    return token
  } catch {
    return null
  }
}
