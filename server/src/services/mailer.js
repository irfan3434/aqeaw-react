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
    // Names only, never values — this line ends up in the hosting provider's logs.
    console.warn(
      `[mailer] SMTP not configured, email disabled. SMTP_HOST:${host ? 'set' : 'MISSING'} ` +
        `SMTP_USER:${user ? 'set' : 'MISSING'} SMTP_PASS:${pass ? 'set' : 'MISSING'}`
    )
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // No connection pooling. Pooling keeps sockets open between sends, which is
    // faster in bursts but unreliable on a dyno that idles or restarts: the
    // provider drops the idle connection and the next send fails against a
    // socket this process still believes is open. Volume here is a handful of
    // messages, so a fresh connection per send is the safer trade.
    greetingTimeout: 10000,
    connectionTimeout: 15000,
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

  const to = (process.env.NOTIFY_TO || process.env.SMTP_USER || '').trim()
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()

  if (!to) {
    console.error('[mailer] No admin recipient: set NOTIFY_TO (or SMTP_USER). Notification skipped.')
    return
  }

  try {
    const { subject, html } = buildSubmissionEmail(doc, type)
    const attachments = await buildAttachments(doc.achievements || [])

    const info = await t.sendMail({ from, to, subject, html, attachments })
    // Recipient and accepted/rejected lists logged so a silent non-delivery can
    // be told apart from the server never having tried.
    console.log(
      `[mailer] Notification -> ${to} | id=${info.messageId} | accepted=${(info.accepted || []).length}` +
        ` rejected=${(info.rejected || []).length} | attachments=${attachments.length}`
    )
    if ((info.rejected || []).length) {
      console.error(`[mailer] Recipient rejected by server: ${info.rejected.join(', ')}`)
    }
  } catch (err) {
    console.error(
      `[mailer] FAILED to send notification -> ${to}:`,
      err?.response || err?.message || err
    )
  }
}

/**
 * Send a short test message to the configured admin recipient and report
 * exactly what the mail server said. Backs POST /admin/test-email so email
 * configuration can be checked from the dashboard rather than host logs.
 *
 * It can only ever send to NOTIFY_TO / SMTP_USER — never to an address taken
 * from the request — so it cannot be turned into a relay for sending mail to
 * third parties.
 */
export async function sendTestEmail() {
  const t = getTransporter()
  if (!t) {
    return {
      ok: false,
      error: 'SMTP is not configured on the server. Check SMTP_HOST, SMTP_USER and SMTP_PASS.',
    }
  }
  const to = (process.env.NOTIFY_TO || process.env.SMTP_USER || '').trim()
  if (!to) return { ok: false, error: 'No admin recipient configured. Set NOTIFY_TO.' }

  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()
  try {
    const info = await t.sendMail({
      from,
      to,
      subject: 'AQEAW — اختبار إعدادات البريد / mail configuration test',
      text:
        'If this message arrived, new-application notifications will reach this address too.\n' +
        'وصول هذه الرسالة يعني أن إشعارات الطلبات الجديدة ستصل إلى هذا العنوان.',
    })
    return {
      ok: true,
      to,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    }
  } catch (err) {
    return { ok: false, to, error: err?.response || err?.message || String(err) }
  }
}

/**
 * Where the judging page lives, for links in judge emails.
 * SITE_URL if set, otherwise the first allowed CORS origin.
 */
function siteUrl() {
  const explicit = (process.env.SITE_URL || '').trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const first = (process.env.CORS_ORIGINS || '').split(',')[0].trim()
  return first.replace(/\/$/, '')
}

/**
 * Tell every active judge that a new application is waiting.
 *
 * Judges score blind, so this deliberately carries NO applicant details — no
 * name, email, phone or category. Only the anonymous candidate code and a link
 * to the judging page. Sent one message per judge rather than a single
 * multi-recipient mail, so judges never see each other's addresses.
 *
 * Fire-and-forget: a mail failure must never affect the applicant's submission.
 */
export async function sendJudgeNewApplicationNotice(judges, code) {
  const t = getTransporter()
  if (!t || !judges?.length) return

  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()
  const link = siteUrl() ? `${siteUrl()}/judge` : ''
  const subject = `طلب جديد بانتظار التحكيم — ${code}`

  const results = await Promise.allSettled(
    judges.map((j) => {
      const html = `
  <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="color:#1e3a5f;margin:0 0 12px">طلب جديد بانتظار التحكيم</h2>
    <p>مرحباً ${escapeHtml(j.name)}،</p>
    <p>تم استلام طلب جديد ضمن جائزة د. عايض القرني للتميّز، وهو بانتظار تقييمك.</p>
    <p style="font-size:20px;font-weight:bold;text-align:center;background:#f3f4f6;padding:14px;border-radius:8px;color:#1e3a5f" dir="ltr">${escapeHtml(code)}</p>
    ${link ? `<p style="text-align:center;margin:20px 0"><a href="${escapeHtml(link)}" style="background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block">فتح صفحة التحكيم</a></p>` : ''}
    <p style="color:#6b7280;font-size:13px">بيانات المرشح مخفية عن المحكّمين. يُرجى التقييم وفق المعايير الستة المعتمدة.</p>
  </div>`
      return t.sendMail({
        from,
        to: j.email,
        subject,
        html,
        text: `طلب جديد بانتظار التحكيم — ${code}${link ? `\n${link}` : ''}`,
      })
    })
  )

  const failed = results.filter((r) => r.status === 'rejected')
  console.log(`[mailer] Judge notice ${code}: ${results.length - failed.length} sent, ${failed.length} failed`)
  for (const f of failed) console.error('[mailer] judge notice failed:', f.reason?.message || f.reason)
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
