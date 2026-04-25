import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@carebid/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
        "@carebid/api": path.resolve(__dirname, "../../packages/api/src/index.ts"),
      },
    },
    server: {
      host: env.VITE_DEV_HOST ?? true,
      port: Number(env.VITE_DEV_PORT) || 5173,
    },
    preview: {
      host: env.VITE_DEV_HOST ?? true,
      port: Number(env.VITE_DEV_PORT) || 5173,
    },
  }
})
