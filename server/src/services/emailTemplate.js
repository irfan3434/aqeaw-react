/**
 * Bilingual (Arabic + English) HTML email template for new submissions.
 * Ported from the previous Outlook-era template, adapted to read from the
 * saved Mongoose document shape.
 */

const td = (label, value) => `
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align:center; background-color: #f4f4f4;">${label}</td>
    <td style="border: 1px solid #ddd; padding: 8px; text-align:center;">${value ?? 'N/A'}</td>
  </tr>
`

const sectionHeading = (text) =>
  `<h3 style="font-family: Arial, sans-serif; color: #007BFF; text-align:center; margin-top: 24px;">${text}</h3>`

const tableOpen = `<table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 20px;">`
const tableClose = `</table>`

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderAchievements(achievements = []) {
  const rows = achievements
    .map(
      (a, i) => `
    <tr style="${i % 2 === 0 ? 'background-color: #f4f4f4;' : ''}">
      <td style="border: 1px solid #ddd; padding: 8px; text-align:center;">${escapeHtml(a.title)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align:center;">${escapeHtml(a.description)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align:center;">
        ${a.file?.filename ? 'ملف مرفق / File Attached' : 'No file'}
      </td>
    </tr>
  `
    )
    .join('')

  return `
    ${sectionHeading('الإنجازات / Achievements')}
    ${tableOpen}
      <tr style="background-color: #007BFF; color: #fff;">
        <th style="border: 1px solid #ddd; padding: 8px; text-align:center;">العنوان / Title</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align:center;">الوصف / Description</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align:center;">File</th>
      </tr>
      ${rows}
    ${tableClose}
  `
}

function renderPersonal(doc) {
  const generalSection = `
    ${sectionHeading('معلومات عامة / General Information')}
    ${tableOpen}
      ${td('نوع النموذج / Form Type', 'Personal')}
      ${td('نوع المستخدم / User Type', doc.userType)}
      ${td('اسم مقدم الطلب / Applicant Name', escapeHtml(doc.fullName))}
      ${td('عمر مقدم الطلب / Applicant Age', doc.age)}
      ${td('جنس مقدم الطلب / Applicant Gender', doc.gender)}
      ${td('البريد الإلكتروني / Email', escapeHtml(doc.email))}
      ${td('رقم الجوال / Phone', escapeHtml(doc.phone))}
      ${td('حدد الانتماء / Specific Affiliation', escapeHtml(doc.specificAffiliation) || 'N/A')}
    ${tableClose}
  `

  const referrerSection =
    doc.userType === 'referral' && doc.referrer
      ? `
    ${sectionHeading('بيانات من قام بترشيح شخص آخر / Referrer Details')}
    ${tableOpen}
      ${td('الاسم الكامل / Referrer Name', escapeHtml(doc.referrer.fullName))}
      ${td('العمر / Referrer Age', doc.referrer.age)}
      ${td('الجنس / Referrer Gender', doc.referrer.gender)}
      ${td('البريد الإلكتروني / Referrer Email', escapeHtml(doc.referrer.email))}
      ${td('رقم الجوال / Referrer Phone', escapeHtml(doc.referrer.phone))}
      ${td('مسوغات الترشيح / Reason for Nomination', escapeHtml(doc.referrer.nominationReason))}
    ${tableClose}
  `
      : ''

  return generalSection + referrerSection + renderAchievements(doc.achievements)
}

function renderOrganization(doc) {
  return `
    ${sectionHeading('معلومات عن المؤسسة / Organization Details')}
    ${tableOpen}
      ${td('نوع النموذج / Form Type', 'Organization')}
      ${td('اسم الكيان / Organization Name', escapeHtml(doc.organizationName))}
      ${td('المالك / Owner Name', escapeHtml(doc.ownerName))}
      ${td('البريد الالكتروني للكيان / Organization Email', escapeHtml(doc.organizationEmail))}
      ${td('رقم جوال التواصل / Organization Phone', escapeHtml(doc.organizationNumber))}
    ${tableClose}
    ${renderAchievements(doc.achievements)}
  `
}

/**
 * @param {object} doc - saved Mongoose document (Personal or Organization)
 * @param {'personal'|'organization'} type
 * @returns {{subject: string, html: string}}
 */
export function buildSubmissionEmail(doc, type) {
  const body = type === 'personal' ? renderPersonal(doc) : renderOrganization(doc)

  const who =
    type === 'personal'
      ? doc.fullName || 'Unknown applicant'
      : doc.organizationName || 'Unknown organization'

  const subject = `New ${type === 'personal' ? 'Personal' : 'Organization'} Application — ${who}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="UTF-8" /></head>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align:center; color: #1a3f6b;">طلب جديد / New Application Received</h2>
        <p style="text-align:center; color: #666;">Submitted: ${new Date(doc.createdAt || Date.now()).toUTCString()}</p>
        ${body}
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #ddd;" />
        <p style="text-align:center; color: #888; font-size: 12px;">
          Application ID: ${doc._id}<br />
          Dr. Ayed Alqarni Excellence Award — <a href="https://aqeaw.com">aqeaw.com</a>
        </p>
      </body>
    </html>
  `

  return { subject, html }
}