import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectDB } from './config/db.js'
import applicationsRouter from './routes/applications.js'
import { UPLOAD_DIR } from './middleware/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT) || 5000
const MONGODB_URI = process.env.MONGODB_URI
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const app = express()

// Trust proxy (Heroku, etc.) so req.ip reflects the real client
app.set('trust proxy', 1)

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin tools (curl, Postman) with no Origin header
      if (!origin) return cb(null, true)
      if (CORS_ORIGINS.includes(origin)) return cb(null, true)
      return cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: false,
  })
)

// JSON parser is fine to enable, though the submit route uses multipart
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

// Serve uploaded files for retrieval (read-only). In production you'd put
// these behind auth or move to S3/Cloudinary.
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d' }))

// API routes
app.use('/', applicationsRouter)

// Start
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