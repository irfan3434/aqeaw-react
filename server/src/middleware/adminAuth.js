import crypto from 'node:crypto'
import mongoose from 'mongoose'

import { User } from '../models/User.js'

/**
 * Simple HMAC-signed token, signed with ADMIN_SECRET.
 *
 * Token format: base64url(payload).base64url(signature)
 * Payload is JSON: { sub: <userId>, role, iat, exp }
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url')
}

export function issueToken(user, secret) {
  const payload = JSON.stringify({
    sub: String(user._id),
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  })
  const encoded = Buffer.from(payload).toString('base64url')
  return `${encoded}.${sign(encoded, secret)}`
}

/** Returns the payload if the token is valid, otherwise null. */
export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const a = Buffer.from(signature)
  const b = Buffer.from(sign(encoded, secret))
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
    if (!payload.sub || !payload.role) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Express middleware factory — requires a valid token for an active user
 * with one of the given roles. Sets req.user.
 */
export function requireRole(...roles) {
  return async (req, res, next) => {
    const secret = process.env.ADMIN_SECRET
    if (!secret) {
      console.error('[auth] ADMIN_SECRET not set')
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    const payload = verifyToken(token, secret)
    if (!payload || !mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      // Checked on every request so disabled/deleted accounts lose access immediately.
      const user = await User.findById(payload.sub, { passwordHash: 0 }).lean()
      if (!user || !user.active) return res.status(401).json({ error: 'Unauthorized' })
      if (!roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden', role: user.role })
      req.user = user
      next()
    } catch (err) {
      console.error('[auth]', err)
      res.status(500).json({ error: 'Auth check failed' })
    }
  }
}

// A superadmin can do everything an admin can, so it passes the admin guard too.
export const requireAdmin = requireRole('admin', 'superadmin')
export const requireSuperadmin = requireRole('superadmin')
export const requireJudge = requireRole('judge')
