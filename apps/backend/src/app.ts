import { Effect, Layer } from "effect"
import { Hono } from "hono"

import { DatabaseError, RequestNotFoundError, SessionError } from "./domain/errors"
import { RequestRepository } from "./domain/ports/request-repository"
import { SessionRepository } from "./domain/ports/session-repository"
import { createOnboardingRoutes, createRequestRoutes, createSessionRoutes } from "./interface/routes"
import { makeAppLayer } from "./layers"

type AppLayer = RequestRepository | SessionRepository

export const runAppEffect = async <Result>(
  env: Env,
  effect: Effect.Effect<Result, RequestNotFoundError | DatabaseError | SessionError, AppLayer>,
  onSuccess: (result: Result) => Response | Promise<Response>,
): Promise<Response> => {
  try {
    const runnable = Effect.provide(effect, makeAppLayer(env))
    const result = await Effect.runPromise(runnable)

    return await onSuccess(result)
  } catch (error) {
    if (error instanceof RequestNotFoundError) {
      return Response.json({ ok: false, error: "Request not found" }, { status: 404 })
    }

    return Response.json({ ok: false, error: "Unexpected backend error" }, { status: 500 })
  }
}

export const createApp = () => {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/health", (c) => c.json({ ok: true, app: c.env.APP_NAME }))
  app.route("/api", createSessionRoutes())
  app.route("/api", createOnboardingRoutes())
  app.route("/api", createRequestRoutes())

  return app
}
