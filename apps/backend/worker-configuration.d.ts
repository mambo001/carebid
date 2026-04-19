interface Env {
  APP_NAME: string
  DATABASE_URL: string
  ALLOWED_ORIGINS?: string
  REQUEST_ROOM_DO: DurableObjectNamespace
}
