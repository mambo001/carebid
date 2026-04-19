import { Effect, ManagedRuntime } from "effect";
import { Hono } from "hono";

import {
  DatabaseError,
  RequestNotFoundError,
  SessionError,
} from "./domain/errors";
import {
  createOnboardingRoutes,
  createRequestRoutes,
  createSessionRoutes,
} from "./interface/routes";
import { makeAppLayer, type AppServices } from "./layers";

export const runEffect = <Result>(
  env: Env,
  effect: Effect.Effect<Result, never, AppServices>,
): Promise<Result> => {
  const runtime = ManagedRuntime.make(makeAppLayer(env));
  return runtime.runPromise(effect);
};

export const handleAppErrors = <Result, R>(
  effect: Effect.Effect<
    Result,
    DatabaseError | RequestNotFoundError | SessionError,
    R
  >,
): Effect.Effect<Result | Response, never, R> =>
  effect.pipe(
    Effect.catchTags({
      RequestNotFoundError: () =>
        Effect.succeed(
          Response.json(
            { ok: false, error: "Request not found" },
            { status: 404 },
          ),
        ),
      SessionError: (e) =>
        Effect.succeed(
          Response.json({ ok: false, error: e.message }, { status: 400 }),
        ),
      DatabaseError: (e) =>
        Effect.succeed(
          Response.json(
            { ok: false, error: e.message ?? "Unexpected backend error" },
            { status: 500 },
          ),
        ),
    }),
  );

export const createApp = () => {
  const app = new Hono<{ Bindings: Env }>();

  app.get("/health", (c) => c.json({ ok: true, app: c.env.APP_NAME }));
  app.route("/api", createSessionRoutes());
  app.route("/api", createOnboardingRoutes());
  app.route("/api", createRequestRoutes());

  return app;
};
