import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { connectDB } from './config/db.js'
import applicationsRouter from './routes/applications.js'
import adminRouter from './routes/admin.js'
import authRouter from './routes/auth.js'
import judgeRouter from './routes/judge.js'
import profileCardsRouter from './routes/profileCards.js'
import { User } from './models/User.js'
import { hashPassword } from './services/passwords.js'

/**
 * First run only: if there are no admin accounts yet, create "admin" using
 * the old shared ADMIN_PASSWORD so the dashboard stays reachable.
 */
async function ensureDefaultAdmin() {
  if (await User.exists({ role: 'admin' })) return
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.warn('[users] No admin accounts and ADMIN_PASSWORD not set — run: npm run user:create')
    return
  }
  await User.create({
    username: 'admin',
    name: 'Administrator',
    role: 'admin',
    passwordHash: await hashPassword(password),
  })
  console.log('[users] Created default admin account "admin" (password = ADMIN_PASSWORD)')
}

const PORT = Number(process.env.PORT) || 5000
const MONGODB_URI = process.env.MONGODB_URI
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Outside production, also allow localhost and private LAN addresses
 * (10.x, 192.168.x, 172.16-31.x), so the site keeps working on phones
 * on the same Wi-Fi even when this computer's IP changes.
 */
function isLocalNetworkOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    )
  } catch {
    return false
  }
}

const app = express()

app.set('trust proxy', 1)

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (CORS_ORIGINS.includes(origin)) return cb(null, true)
      if (isLocalNetworkOrigin(origin)) return cb(null, true)
      return cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: false,
    // Lets the browser read download filenames
    exposedHeaders: ['Content-Disposition'],
  })
)

// Profile cards carry a photo inside the JSON body, so they get a bigger limit.
app.use('/admin/profile-cards', express.json({ limit: '8mb' }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

app.use('/', applicationsRouter)
app.use('/', authRouter) // must come before adminRouter (login is public)
app.use('/', judgeRouter)
app.use('/', profileCardsRouter) // before adminRouter; has its own public + admin routes
app.use('/', adminRouter)

async function start() {
  try {
    await connectDB(MONGODB_URI)
    await ensureDefaultAdmin()
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