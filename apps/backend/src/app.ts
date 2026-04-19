import { Effect } from "effect"
import { Hono } from "hono"

import { RequestNotFoundError } from "./domain/errors/request-not-found"
import { createOnboardingRoutes, createRequestRoutes, createSessionRoutes } from "./interface/routes"
import { makeAppLayer } from "./layers"

export const runAppEffect = async <Result, Requirements>(
  env: Env,
  effect: Effect.Effect<Result, unknown, Requirements>,
  onSuccess: (result: Result) => Response | Promise<Response>,
): Promise<Response> => {
  try {
    const runnable = effect.pipe(Effect.provide(makeAppLayer(env) as any)) as Effect.Effect<Result, unknown, never>
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
