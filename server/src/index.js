import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { connectDB } from './config/db.js'
import applicationsRouter from './routes/applications.js'
import adminRouter from './routes/admin.js'

const PORT = Number(process.env.PORT) || 5000
const MONGODB_URI = process.env.MONGODB_URI
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const app = express()

app.set('trust proxy', 1)

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (CORS_ORIGINS.includes(origin)) return cb(null, true)
      return cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: false,
  })
)

app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

app.use('/', applicationsRouter)
app.use('/', adminRouter)

async function start() {
  try {
    await connectDB(MONGODB_URI)
    app.listen(PORT, () => {
      console.log(`[server] Listening on http://localhost:${PORT}`)
      console.log(`[server] CORS origins: ${CORS_ORIGINS.join(', ')}`)
    })
  } catch (err) {
    console.error('[server] Failed to start:', err)
    process.exit(1)
  }
}

start()