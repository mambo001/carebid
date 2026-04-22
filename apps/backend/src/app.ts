import { HttpMiddleware, HttpRouter, HttpServer } from "@effect/platform"
import { Effect, Layer } from "effect"

import type { AppConfig } from "./shared/config/runtime-env"
import { makeAppLayer } from "./layers"
import { apiRouter } from "./http"
import { errorResponse, json } from "./http/common"

export const makeHttpApp = (config: AppConfig) =>
  HttpRouter.empty.pipe(
    HttpRouter.get("/health", json({ ok: true, app: config.appName })),
    HttpRouter.concat(apiRouter),
    HttpRouter.catchAll((error) => Effect.succeed(errorResponse(error))),
    HttpMiddleware.cors({
      allowedOrigins: config.allowedOrigins,
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )

export const makeServerLayer = (config: AppConfig) =>
  makeHttpApp(config).pipe(HttpServer.serve(), Layer.provide(makeAppLayer(config)))
