const processEnv = process.env

export type AppConfig = {
  appName: string
  port: number
  databaseUrl: string
  allowedOrigins: Array<string>
  redisUrl?: string
  firebaseProjectId?: string
}

const parsePort = (value: string | undefined) => {
  const parsed = Number(value ?? "8080")
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8080
}

export const getAppConfig = (): AppConfig => ({
  appName: processEnv.APP_NAME || "CareBid",
  port: parsePort(processEnv.PORT),
  databaseUrl: processEnv.DATABASE_URL || "",
  allowedOrigins: (processEnv.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  redisUrl: processEnv.REDIS_URL || undefined,
  firebaseProjectId: processEnv.FIREBASE_PROJECT_ID || undefined,
})
