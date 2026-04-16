import nodemailer from 'nodemailer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildSubmissionEmail } from './emailTemplate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// uploads/ is at server/uploads (two levels up from src/services/)
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

let transporter = null

/**
 * Lazily create the Nodemailer transport. Called from sendSubmissionNotification
 * so the server can still boot even if SMTP creds are missing — email will just
 * no-op with a warning log.
 */
function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP env vars missing — email notifications disabled.')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/STARTTLS
    auth: { user, pass },
  })

  return transporter
}

/**
 * Build attachments array from the saved achievement documents.
 * Each achievement may have a .file with a path under uploads/.
 */
function buildAttachments(achievements) {
  return achievements
    .filter((a) => a?.file?.filename)
    .map((a) => {
      const filePath = path.join(UPLOAD_DIR, a.file.filename)
      // Only attach if the file actually exists on disk.
      // On Heroku's ephemeral FS, this file will still be present in the same
      // request, but on a later restart it won't be — that's fine, we just skip it.
      if (!fs.existsSync(filePath)) return null
      return {
        filename: a.file.originalName || a.file.filename,
        path: filePath,
      }
    })
    .filter(Boolean)
}

/**
 * Send a notification email for a submitted application.
 * Fire-and-forget: never throws; errors are logged.
 *
 * @param {object} doc   The saved Mongoose document (personal or organization)
 * @param {'personal'|'organization'} type
 */
export async function sendSubmissionNotification(doc, type) {
  const t = getTransporter()
  if (!t) return // SMTP not configured — silently skip

  const to = process.env.NOTIFY_TO || process.env.SMTP_USER
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  try {
    const { subject, html } = buildSubmissionEmail(doc, type)
    const attachments = buildAttachments(doc.achievements || [])

    const info = await t.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    })

    console.log(`[mailer] Notification sent: ${info.messageId}`)
  } catch (err) {
    console.error('[mailer] Failed to send notification:', err)
  }
}