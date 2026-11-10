import crypto from 'crypto'
import { Router } from 'express'
import mongoose from 'mongoose'

import { User } from '../models/User.js'
import { issueToken, verifyToken } from '../middleware/adminAuth.js'
import { verifyPassword, DUMMY_HASH } from '../services/passwords.js'
import { sendLoginCode } from '../services/mailer.js'

const router = Router()

// Basic brute-force protection: max failed attempts per IP per window.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 10
const fails = new Map() // ip -> { count, resetAt }

// Email verification code settings
const CODE_TTL_MS = 10 * 60 * 1000
const CODE_MAX_ATTEMPTS = 5
const RESEND_WAIT_MS = 30 * 1000

function tooManyFails(ip) {
  const entry = fails.get(ip)
  if (!entry) return false
  if (Date.now() > entry.resetAt) {
    fails.delete(ip)
    return false
  }
  return entry.count >= MAX_FAILS
}

function recordFail(ip) {
  const entry = fails.get(ip)
  if (!entry || Date.now() > entry.resetAt) {
    fails.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

// The challenge token is signed with a different key, so it can never be used as a session token.
const challengeSecret = (secret) => `${secret}:login-code`

function hashCode(code, user, secret) {
  return crypto.createHmac('sha256', secret).update(`${user._id}:${code}`).digest('hex')
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@')
  if (!domain) return email
  const shown = local.length <= 2 ? local[0] : local.slice(0, 2)
  return `${shown}${'*'.repeat(Math.max(local.length - shown.length, 3))}@${domain}`
}

function sessionResponse(user, secret) {
  return {
    ok: true,
    token: issueToken(user, secret),
    user: { id: String(user._id), username: user.username, name: user.name, role: user.role },
  }
}

/**
 * Create a new code, store its hash, and email it.
 * On a resend, the previous code keeps working too, so a late email isn't useless.
 */
async function sendNewCode(user, secret, { keepPrevious = false } = {}) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  const previousValid = user.otpHash && user.otpExpiresAt && Date.now() < user.otpExpiresAt.getTime()
  user.otpPrevHash = keepPrevious && previousValid ? user.otpHash : undefined
  user.otpHash = hashCode(code, user, secret)
  user.otpExpiresAt = new Date(Date.now() + CODE_TTL_MS)
  user.otpAttempts = 0
  user.otpSentAt = new Date()
  await user.save()

  const sent = await sendLoginCode(user.email, user.name, code)
  if (!sent && process.env.NODE_ENV !== 'production') {
    // Development fallback so nobody is locked out while email isn't set up.
    console.warn(`[login] Email not sent. Code for "${user.username}": ${code}`)
    return true
  }
  return sent
}

function getSecret(res) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('[login] ADMIN_SECRET not set')
    res.status(500).json({ error: 'Server misconfigured' })
  }
  return secret
}

/** Reads the challenge token and loads its user, or returns null. */
async function userFromChallenge(challenge, secret) {
  const payload = verifyToken(String(challenge || ''), challengeSecret(secret))
  if (!payload || payload.role !== 'login-code' || !mongoose.isValidObjectId(payload.sub)) return null
  // A login attempt is only valid for a short time after the password was checked.
  if (Date.now() - payload.iat > CODE_TTL_MS + 5 * 60 * 1000) return null
  const user = await User.findById(payload.sub)
  return user && user.active ? user : null
}

/* -------------------------------------------------------------------------- */
/*  POST /admin/login   { username, password }                                */
/*  Step 1. Accounts with an email get a code by email (step 2 below);        */
/*  accounts without one are signed in directly.                              */
/* -------------------------------------------------------------------------- */
router.post('/admin/login', async (req, res) => {
  const secret = getSecret(res)
  if (!secret) return

  const ip = req.ip || 'unknown'
  if (tooManyFails(ip)) {
    return res.status(429).json({ error: 'Too many attempts, try again later' })
  }

  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  try {
    const user = username ? await User.findOne({ username }) : null
    const ok = await verifyPassword(password, user?.passwordHash || DUMMY_HASH)

    if (!user || !ok || !user.active) {
      recordFail(ip)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (user.email) {
      const sent = await sendNewCode(user, secret)
      if (!sent) return res.status(502).json({ error: 'Could not send the verification code' })
      return res.json({
        ok: true,
        codeRequired: true,
        challenge: issueToken({ _id: user._id, role: 'login-code' }, challengeSecret(secret)),
        email: maskEmail(user.email),
      })
    }

    fails.delete(ip)
    user.lastLoginAt = new Date()
    await user.save()
    res.json(sessionResponse(user, secret))
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

/* -------------------------------------------------------------------------- */
/*  POST /admin/login/verify   { challenge, code }                            */
/*  Step 2. Checks the 6-digit code and returns the session token.            */
/* -------------------------------------------------------------------------- */
router.post('/admin/login/verify', async (req, res) => {
  const secret = getSecret(res)
  if (!secret) return

  const ip = req.ip || 'unknown'
  if (tooManyFails(ip)) {
    return res.status(429).json({ error: 'Too many attempts, try again later' })
  }

  try {
    const user = await userFromChallenge(req.body?.challenge, secret)
    if (!user || !user.otpHash) return res.status(401).json({ error: 'Session expired', reason: 'expired' })

    if (!user.otpExpiresAt || Date.now() > user.otpExpiresAt.getTime()) {
      return res.status(401).json({ error: 'Code expired', reason: 'expired' })
    }
    if (user.otpAttempts >= CODE_MAX_ATTEMPTS) {
      return res.status(401).json({ error: 'Too many wrong codes', reason: 'locked' })
    }

    const code = String(req.body?.code || '').replace(/\D/g, '')
    const given = Buffer.from(hashCode(code, user, secret))
    const matches = (stored) => {
      if (!stored) return false
      const b = Buffer.from(stored)
      return given.length === b.length && crypto.timingSafeEqual(given, b)
    }
    // The newest code, or the one before it if the user asked for a resend.
    if (code.length !== 6 || !(matches(user.otpHash) || matches(user.otpPrevHash))) {
      user.otpAttempts += 1
      await user.save()
      recordFail(ip)
      return res.status(401).json({
        error: 'Wrong code',
        reason: 'wrong',
        attemptsLeft: Math.max(CODE_MAX_ATTEMPTS - user.otpAttempts, 0),
      })
    }

    user.otpHash = undefined
    user.otpPrevHash = undefined
    user.otpExpiresAt = undefined
    user.otpAttempts = 0
    user.lastLoginAt = new Date()
    await user.save()
    fails.delete(ip)
    res.json(sessionResponse(user, secret))
  } catch (err) {
    console.error('[login/verify]', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

/* -------------------------------------------------------------------------- */
/*  POST /admin/login/resend   { challenge }                                  */
/* -------------------------------------------------------------------------- */
router.post('/admin/login/resend', async (req, res) => {
  const secret = getSecret(res)
  if (!secret) return

  try {
    const user = await userFromChallenge(req.body?.challenge, secret)
    if (!user || !user.email) return res.status(401).json({ error: 'Session expired', reason: 'expired' })

    const wait = user.otpSentAt ? user.otpSentAt.getTime() + RESEND_WAIT_MS - Date.now() : 0
    if (wait > 0) return res.status(429).json({ error: 'Please wait', retryAfter: Math.ceil(wait / 1000) })

    const sent = await sendNewCode(user, secret, { keepPrevious: true })
    if (!sent) return res.status(502).json({ error: 'Could not send the verification code' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[login/resend]', err)
    res.status(500).json({ error: 'Resend failed' })
  }
})

export default router
