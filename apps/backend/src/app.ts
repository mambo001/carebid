import { Effect, ManagedRuntime } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  AuthError,
  DatabaseError,
  RequestNotFoundError,
  SessionError,
} from "./domain/errors";
import {
  createOnboardingRoutes,
  createRequestRoutes,
  createSessionRoutes,
} from "./interface/routes";
import { authMiddleware } from "./interface/middleware/auth";
import { makeAppLayer, type AppServices } from "./layers";

const runtimeCache = new Map<string, ManagedRuntime.ManagedRuntime<AppServices, never>>();

const getRuntime = (env: Env): ManagedRuntime.ManagedRuntime<AppServices, never> => {
  const key = env.DATABASE_URL ?? "";
  let runtime = runtimeCache.get(key);
  if (!runtime) {
    runtime = ManagedRuntime.make(makeAppLayer(env));
    runtimeCache.set(key, runtime);
  }
  return runtime;
};

export const runEffect = <Result, Error>(
  env: Env,
  effect: Effect.Effect<Result, Error, AppServices>,
): Promise<Result> => {
  return getRuntime(env).runPromise(effect);
};

export const handleAppErrors = <Result, R>(
  effect: Effect.Effect<
    Result,
    AuthError | DatabaseError | RequestNotFoundError | SessionError,
    R
  >,
): Effect.Effect<Result | Response, never, R> =>
  effect.pipe(
    Effect.catchTags({
      AuthError: (e) =>
        Effect.succeed(
          Response.json({ ok: false, error: e.message ?? "Unauthorized" }, { status: 401 }),
        ),
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

  app.use(
    "*",
    cors({
      origin: (origin, c) => {
        const allowed = c.env.ALLOWED_ORIGINS?.split(",") ?? [];
        allowed.push("http://localhost:5173");
        return allowed.includes(origin) ? origin : "";
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, app: c.env.APP_NAME }));

  app.use("/api/*", authMiddleware());

  app.route("/api", createSessionRoutes());
  app.route("/api", createOnboardingRoutes());
  app.route("/api", createRequestRoutes());

  return app;
};
