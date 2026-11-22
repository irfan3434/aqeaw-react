import { Router } from 'express'

import { sendContactMessage } from '../services/mailer.js'
import { isValidEmail, isValidName, isFilled, asText } from '../config/validation.js'

/**
 * The public Contact Us form.
 *
 * There was no endpoint at all before this: the form showed "sent
 * successfully" and dropped the message on the floor, so anyone writing to
 * the award believed they had been heard and nobody ever received it.
 */
const router = Router()

const MAX_MESSAGE = 5000
const MIN_MESSAGE = 10

/**
 * One visitor, a handful of messages an hour. This endpoint sends email on
 * demand from an unauthenticated form, which is exactly the shape of thing
 * that gets used to flood an inbox — and the award's mail provider would
 * rate-limit or blacklist the sending address long before anyone noticed.
 *
 * In memory, so it resets when the dyno restarts and is not shared between
 * dynos. At this volume that is fine; it stops the obvious abuse.
 */
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5
const sends = new Map() // ip -> { count, resetAt }

function rateLimited(ip) {
  const entry = sends.get(ip)
  if (!entry || Date.now() > entry.resetAt) return false
  return entry.count >= MAX_PER_WINDOW
}

function recordSend(ip) {
  const entry = sends.get(ip)
  if (!entry || Date.now() > entry.resetAt) {
    sends.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS })
    return
  }
  entry.count += 1
}

// Without this the map grows one entry per visitor for the life of the process.
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of sends) if (now > entry.resetAt) sends.delete(ip)
}, WINDOW_MS).unref?.()

/* POST /contact   { name, email, message } */
router.post('/contact', async (req, res) => {
  try {
    const name = asText(req.body?.name)
    const email = asText(req.body?.email)
    const message = asText(req.body?.message)

    const fields = []
    if (!isValidName(name)) fields.push('name')
    if (!isValidEmail(email)) fields.push('email')
    if (!isFilled(message) || message.length < MIN_MESSAGE) fields.push('message')

    if (fields.length) {
      return res.status(400).json({
        error: 'Some details are missing or invalid.',
        fields,
      })
    }
    if (message.length > MAX_MESSAGE) {
      return res.status(400).json({
        error: `Please keep the message under ${MAX_MESSAGE} characters.`,
        fields: ['message'],
      })
    }

    if (rateLimited(req.ip)) {
      return res
        .status(429)
        .json({ error: 'Too many messages from this address. Please try again later.' })
    }

    // Awaited, unlike the application notification: there is nothing stored
    // here, so if the mail fails there is no record of the message anywhere.
    // The visitor has to be told, while they still have the text on screen.
    const result = await sendContactMessage({ name, email, message })
    if (!result.ok) {
      return res.status(502).json({ error: result.error || 'The message could not be sent.' })
    }

    recordSend(req.ip)
    res.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    res.status(500).json({ error: 'The message could not be sent.' })
  }
})

export default router
