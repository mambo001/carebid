import { HttpRouter, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"

// Test what type HttpRouter.get expects
const handler = HttpRouter.get("/test", Effect.succeed(HttpServerResponse.text("ok")))
