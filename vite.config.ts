import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE = env.VITE_API_BASE_URL || 'https://lms.bookbank.com.ng'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: API_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p, // keep /api prefix
        },
      },
    },
  }
})
