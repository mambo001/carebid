import { NodeRuntime } from "@effect/platform-node"

import { main } from "./environments/environment.dev"

NodeRuntime.runMain(main)
