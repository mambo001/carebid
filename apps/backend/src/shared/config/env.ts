import { Context, Layer } from "effect"

/**
 * Re-export the globally declared Env interface from worker-configuration.d.ts.
 * This provides a single import point for the worker bindings type.
 *
 * The global Env interface contains:
 * - APP_NAME: string
 * - DATABASE_URL: string
 * - REQUEST_ROOM_DO: DurableObjectNamespace
 */
export type AppEnv = Env

export const AppEnv = Context.GenericTag<AppEnv>("@carebid/AppEnv")

export const makeAppEnvLayer = (env: AppEnv) => Layer.succeed(AppEnv, env)
