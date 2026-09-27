import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// In produzione /api/igdb-search è una funzione Vercel (api/igdb-search.ts); `vite dev`
// non serve la cartella api/, quindi qui la eseguiamo come middleware locale con le
// chiavi IGDB_* lette dal .env (mai esposte al browser: niente prefisso VITE_).
const localIgdbApi = (env: Record<string, string>): Plugin => ({
  name: 'local-igdb-api',
  apply: 'serve',
  configureServer(server) {
    process.env.IGDB_CLIENT_ID ??= env.IGDB_CLIENT_ID
    process.env.IGDB_CLIENT_SECRET ??= env.IGDB_CLIENT_SECRET
    server.middlewares.use('/api/igdb-search', async (req, res) => {
      const { default: handler } = await server.ssrLoadModule('/api/igdb-search.ts')
      const response: Response = await handler(new Request(`http://localhost${req.originalUrl}`, { method: req.method }))
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(await response.text())
    })
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), localIgdbApi(loadEnv(mode, process.cwd(), 'IGDB_'))],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
