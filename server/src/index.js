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
import { notFound, errorHandler } from './middleware/errorHandler.js'

/**
 * Makes sure a superadmin exists — the only role that can manage accounts.
 *
 * 1. Already have one? Nothing to do.
 * 2. Exactly one admin (the pre-superadmin setup)? Promote it, so the person
 *    who ran this before the roles changed keeps full access.
 * 3. Several admins? Don't guess which one — say so and leave it to the CLI.
 * 4. Fresh install? Create "admin" from ADMIN_PASSWORD as superadmin.
 */
async function ensureSuperadmin() {
  if (await User.exists({ role: 'superadmin' })) return

  const admins = await User.find({ role: 'admin' }, { username: 1, name: 1 }).lean()
  if (admins.length === 1) {
    await User.updateOne({ _id: admins[0]._id }, { $set: { role: 'superadmin' } })
    console.log(`[users] Promoted "${admins[0].username}" to superadmin (role migration)`)
    return
  }
  if (admins.length > 1) {
    console.warn(
      `[users] No superadmin, and ${admins.length} admins exist — not guessing which to promote.\n` +
        '        Promote one with: npm run user:create -- <username> superadmin "<Full Name>" <password> [email]'
    )
    return
  }

  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.warn('[users] No accounts and ADMIN_PASSWORD not set — run: npm run user:create')
    return
  }
  await User.create({
    username: 'admin',
    name: 'Administrator',
    role: 'superadmin',
    passwordHash: await hashPassword(password),
  })
  console.log('[users] Created superadmin account "admin" (password = ADMIN_PASSWORD)')
}

const PORT = Number(process.env.PORT) || 5000
const MONGODB_URI = process.env.MONGODB_URI
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Development convenience: also allow localhost and private LAN addresses
 * (10.x, 192.168.x, 172.16-31.x), so the site keeps working on a phone on the
 * same Wi-Fi even when this computer's IP changes.
 *
 * This FAILS CLOSED. It is off unless ALLOW_LAN_ORIGINS is explicitly "true",
 * so forgetting to set NODE_ENV on a host can never silently widen CORS.
 * NODE_ENV=production disables it as well, even if the flag is set — so a
 * .env copied from a laptop to a server still can't re-open it.
 */
const ALLOW_LAN_ORIGINS =
  process.env.ALLOW_LAN_ORIGINS === 'true' && process.env.NODE_ENV !== 'production'

function isLocalNetworkOrigin(origin) {
  if (!ALLOW_LAN_ORIGINS) return false
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
      // Logged because a blocked origin otherwise looks like a dead API in the
      // browser, with nothing server-side explaining why.
      console.warn(`[cors] Blocked origin ${origin} — add it to CORS_ORIGINS if this is your site`)
      const err = new Error(`CORS: origin ${origin} not allowed`)
      err.code = 'CORS_NOT_ALLOWED'
      return cb(err)
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

// Must stay last: these only see what the routers above didn't handle.
app.use(notFound)
app.use(errorHandler)

async function start() {
  try {
    await connectDB(MONGODB_URI)
    await ensureSuperadmin()
    app.listen(PORT, () => {
      console.log(`[server] Listening on http://localhost:${PORT}`)
      console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`)
      console.log(`[server] CORS origins: ${CORS_ORIGINS.join(', ')}`)
      console.log(
        `[server] LAN origins: ${ALLOW_LAN_ORIGINS ? 'allowed (development)' : 'blocked'}`
      )
      // A live site that only lists localhost will fail every browser request.
      if (!process.env.CORS_ORIGINS) {
        console.warn('[server] CORS_ORIGINS is not set — falling back to http://localhost:3000')
      }
    })
  } catch (err) {
    console.error('[server] Failed to start:', err)
    process.exit(1)
  }
}

start()