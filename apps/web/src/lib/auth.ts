import { createAuthClient } from "@neondatabase/neon-js/auth"

const neonAuthUrl =
  import.meta.env.VITE_NEON_AUTH_URL ??
  "https://ep-green-morning-amhwk5kg.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth"

export const authClient = createAuthClient(neonAuthUrl)

export type AuthSession = {
  user: { id: string; email: string; name: string }
  session: { id: string; token: string }
}

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const result = await authClient.getSession()
    return result.data?.session?.token ?? null
  } catch {
    return null
  }
}
