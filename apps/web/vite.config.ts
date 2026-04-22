import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
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