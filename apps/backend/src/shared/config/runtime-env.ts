const processEnv =
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env ?? {}

export const getDatabaseUrl = (env: Env): string => env.DATABASE_URL || processEnv.DATABASE_URL || ""

export const getAllowedOrigins = (env: Env): Array<string> => {
  const configured = env.ALLOWED_ORIGINS || processEnv.ALLOWED_ORIGINS || ""
  return configured.split(",").map((item) => item.trim()).filter(Boolean)
}
