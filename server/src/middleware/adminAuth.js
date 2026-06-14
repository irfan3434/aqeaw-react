import crypto from 'node:crypto'

/**
 * Simple HMAC-signed token. No database, no JWT library — we just sign a
 * payload with ADMIN_SECRET and verify it on each request.
 *
 * Token format: base64url(payload).base64url(signature)
 * Payload is JSON: { iat: <issued-at-ms>, exp: <expiry-ms> }
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function b64url(buf) {
  return Buffer.from(buf).toString('base64url')
}

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url')
}

export function issueAdminToken(secret) {
  const payload = JSON.stringify({ iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS })
  const encoded = b64url(payload)
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

export function verifyAdminToken(token, secret) {
  if (!token || typeof token !== 'string') return false
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return false

  const expected = sign(encoded, secret)
  // Constant-time comparison
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!crypto.timingSafeEqual(a, b)) return false

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false
    return true
  } catch {
    return false
  }
}

/**
 * Express middleware — rejects the request unless Authorization: Bearer <token>
 * carries a valid admin token.
 */
export function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('[auth] ADMIN_SECRET not set')
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!verifyAdminToken(token, secret)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}