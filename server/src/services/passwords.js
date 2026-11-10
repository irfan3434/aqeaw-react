import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const KEY_LEN = 64

/** Returns "scrypt$<salt>$<hash>" */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url')
  const hash = await scrypt(String(password), salt, KEY_LEN)
  return `scrypt$${salt}$${hash.toString('base64url')}`
}

export async function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored || '').split('$')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = await scrypt(String(password), salt, expected.length)
  return crypto.timingSafeEqual(actual, expected)
}

// Used when the username doesn't exist, so the response time doesn't reveal it.
export const DUMMY_HASH = 'scrypt$c2FsdHNhbHRzYWx0c2FsdA$' + Buffer.alloc(KEY_LEN).toString('base64url')
