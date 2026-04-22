import cors from "cors"
import express from "express"
import { Effect, ManagedRuntime } from "effect"

import type { AppConfig } from "./shared/config/runtime-env"
import { AuthError, BidNotFoundError, DatabaseError, RequestNotFoundError, RoomNotOpenError, SessionError } from "./domain/errors"
import { makeAppLayer, type AppServices } from "./layers"
import { createOnboardingRoutes, createRequestRoutes, createSessionRoutes, createStreamRoutes } from "./interface/routes"
import { authMiddleware } from "./interface/middleware/auth"

const getRuntime = (config: AppConfig): ManagedRuntime.ManagedRuntime<AppServices, never> =>
  ManagedRuntime.make(makeAppLayer(config))

export const runEffect = <Result, Error>(
  config: AppConfig,
  effect: Effect.Effect<Result, Error, AppServices>,
): Promise<Result> => getRuntime(config).runPromise(effect)

export const sendErrorResponse = (error: unknown, res: express.Response) => {
  if (error instanceof AuthError) {
    return res.status(401).json({ ok: false, error: error.message ?? "Unauthorized" })
  }

  if (error instanceof RequestNotFoundError) {
    return res.status(404).json({ ok: false, error: error.message ?? "Request not found" })
  }

  if (error instanceof SessionError || error instanceof RoomNotOpenError || error instanceof BidNotFoundError) {
    return res.status(409).json({ ok: false, error: error.message ?? "Request conflict" })
  }

  if (error instanceof DatabaseError) {
    return res.status(500).json({ ok: false, error: error.message ?? "Unexpected backend error" })
  }

  return res.status(500).json({ ok: false, error: "Unexpected backend error" })
}

export const createApp = (config: AppConfig) => {
  const app = express()

  app.use(
    cors({
      origin: config.allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  app.use(express.json())

  app.get("/health", (_req, res) => {
    res.json({ ok: true, app: config.appName })
  })

  app.use("/api", authMiddleware(config))
  app.use("/api", createSessionRoutes(config))
  app.use("/api", createOnboardingRoutes(config))
  app.use("/api", createRequestRoutes(config))
  app.use("/api", createStreamRoutes(config))

  return app
}
