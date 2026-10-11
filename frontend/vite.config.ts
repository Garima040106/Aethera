import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: [],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      'import.meta.env.VITE_AWS_LOCATION_API_KEY': JSON.stringify(env.AMAZON_LOCATION || ''),
      'import.meta.env.VITE_AWS_REGION': JSON.stringify(env.VITE_AWS_REGION || 'us-east-1'),
      'import.meta.env.VITE_AWS_LOCATION_MAP_NAME': JSON.stringify(env.AWS_LOCATION_MAP_NAME || ''),
      'import.meta.env.VITE_ROUTE_AQI_SCORE_URL': JSON.stringify(env.VITE_ROUTE_AQI_SCORE_URL || ''),
    },
  }
})
