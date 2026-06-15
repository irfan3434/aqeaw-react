import nodemailer from 'nodemailer'
import { buildSubmissionEmail } from './emailTemplate.js'
import { readGridFSToBuffer } from './gridfsStorage.js'

let transporter = null

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
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

/**
 * Build email attachments by reading file content from GridFS.
 */
async function buildAttachments(achievements) {
  const attachments = []
  for (const a of achievements) {
    if (!a?.file?.fileId) continue
    try {
      const buffer = await readGridFSToBuffer(a.file.fileId)
      attachments.push({
        filename: a.file.originalName || a.file.filename || 'attachment',
        content: buffer,
        contentType: a.file.mimeType || 'application/octet-stream',
      })
    } catch (err) {
      console.error(`[mailer] Failed to read file ${a.file.fileId}:`, err)
    }
  }
  return attachments
}

/**
 * Send a notification email. Fire-and-forget.
 */
export async function sendSubmissionNotification(doc, type) {
  const t = getTransporter()
  if (!t) return

  const to = process.env.NOTIFY_TO || process.env.SMTP_USER
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  try {
    const { subject, html } = buildSubmissionEmail(doc, type)
    const attachments = await buildAttachments(doc.achievements || [])

    const info = await t.sendMail({ from, to, subject, html, attachments })
    console.log(`[mailer] Notification sent: ${info.messageId}`)
  } catch (err) {
    console.error('[mailer] Failed to send notification:', err)
  }
}