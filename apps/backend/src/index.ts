import { createServer } from "node:http"

import { createApp } from "./app"
import { startRedisRoomSubscriber } from "./infra/realtime/redis-room-subscriber"
import { getAppConfig } from "./shared/config/runtime-env"

const config = getAppConfig()
const app = createApp(config)

startRedisRoomSubscriber(config)

const server = createServer(app)

server.listen(config.port, () => {
  console.info(`carebid-backend listening on :${config.port}`)
})
