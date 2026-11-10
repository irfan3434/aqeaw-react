import nodemailer from 'nodemailer'
import { buildSubmissionEmail } from './emailTemplate.js'
import { readGridFSToBuffer } from './gridfsStorage.js'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = (process.env.SMTP_USER || '').trim()
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
    // Keep the connection open so login codes go out quickly
    pool: true,
    maxConnections: 2,
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

/**
 * Email a 6-digit login code. Returns true if the mail server accepted it.
 */
export async function sendLoginCode(to, name, code) {
  const t = getTransporter()
  if (!t) return false
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()
  const html = `
  <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="color:#1e3a5f;margin:0 0 12px">رمز التحقق لتسجيل الدخول</h2>
    <p>مرحباً ${escapeHtml(name)}،</p>
    <p>رمز التحقق الخاص بك لدخول لوحة جائزة د. عايض القرني:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;background:#f3f4f6;padding:16px;border-radius:8px;color:#1e3a5f" dir="ltr">${code}</p>
    <p style="color:#6b7280;font-size:13px">الرمز صالح لمدة 10 دقائق. إذا لم تطلب تسجيل الدخول، تجاهل هذه الرسالة وغيّر كلمة المرور.</p>
  </div>`
  try {
    const info = await t.sendMail({ from, to, subject: `رمز التحقق: ${code}`, html, text: `رمز التحقق: ${code} (صالح 10 دقائق)` })
    console.log(`[mailer] Login code sent to ${to}: ${info.response}`)
    return true
  } catch (err) {
    console.error('[mailer] Failed to send login code:', err.message)
    return false
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
