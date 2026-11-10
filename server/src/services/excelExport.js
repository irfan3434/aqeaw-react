import ExcelJS from 'exceljs'

/**
 * Build an XLSX workbook with two sheets — one per application type —
 * each row is a submission, with columns for every field. Achievements
 * are collapsed into a single multi-line cell since they're 1..4 per row.
 */
const RESULT_LABELS = { winner: 'Winner / فائز', notWinner: 'Lost / خسران', pending: 'Pending / قيد التحكيم' }

export async function buildApplicationsWorkbook(personalDocs, orgDocs, summaries = new Map(), resultOf = () => 'pending') {
  // Average judge score per application (empty when nobody has scored it yet)
  const score = (d) => {
    const e = summaries.get(String(d._id))
    return {
      avgScore: e ? `${e.avg} / ${e.maxTotal}` : '',
      judgesCount: e ? e.count : 0,
      judgeScores: e ? e.judges.map((j) => `${j.name}: ${j.total}`).join('\n') : '',
      result: RESULT_LABELS[resultOf(e)],
    }
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AQEAW Admin'
  wb.created = new Date()

  // ---------- Personal sheet ----------
  const personal = wb.addWorksheet('Personal')
  personal.columns = [
    { header: 'Submitted', key: 'submittedAt', width: 20 },
    { header: 'Application ID', key: 'id', width: 28 },
    { header: 'User Type', key: 'userType', width: 12 },
    { header: 'Full Name', key: 'fullName', width: 25 },
    { header: 'Age', key: 'age', width: 6 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Tribe Checked', key: 'tribeChecked', width: 14 },
    { header: 'Affiliation', key: 'specificAffiliation', width: 16 },
    { header: 'Referrer Name', key: 'referrerName', width: 25 },
    { header: 'Referrer Email', key: 'referrerEmail', width: 28 },
    { header: 'Referrer Phone', key: 'referrerPhone', width: 18 },
    { header: 'Nomination Reason', key: 'nominationReason', width: 40 },
    { header: 'Achievements', key: 'achievements', width: 60 },
    { header: 'Files', key: 'files', width: 40 },
    { header: 'Avg Score', key: 'avgScore', width: 14 },
    { header: 'Judges', key: 'judgesCount', width: 9 },
    { header: 'Score per Judge', key: 'judgeScores', width: 28 },
    { header: 'Result', key: 'result', width: 22 },
  ]

  for (const d of personalDocs) {
    personal.addRow({
      submittedAt: d.createdAt?.toISOString() || '',
      id: String(d._id),
      userType: d.userType || '',
      fullName: d.fullName || '',
      age: d.age || '',
      gender: d.gender || '',
      email: d.email || '',
      phone: d.phone || '',
      tribeChecked: d.tribeChecked ? 'Yes' : 'No',
      specificAffiliation: d.specificAffiliation || '',
      referrerName: d.referrer?.fullName || '',
      referrerEmail: d.referrer?.email || '',
      referrerPhone: d.referrer?.phone || '',
      nominationReason: d.referrer?.nominationReason || '',
      achievements: (d.achievements || [])
        .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description}`)
        .join('\n\n'),
      files: (d.achievements || [])
        .filter((a) => a.file?.filename)
        .map((a) => a.file.originalName || a.file.filename)
        .join('\n'),
      ...score(d),
    })
  }

  // ---------- Organization sheet ----------
  const org = wb.addWorksheet('Organization')
  org.columns = [
    { header: 'Submitted', key: 'submittedAt', width: 20 },
    { header: 'Application ID', key: 'id', width: 28 },
    { header: 'Organization Name', key: 'organizationName', width: 30 },
    { header: 'Owner', key: 'ownerName', width: 25 },
    { header: 'Email', key: 'organizationEmail', width: 28 },
    { header: 'Phone', key: 'organizationNumber', width: 18 },
    { header: 'Achievements', key: 'achievements', width: 60 },
    { header: 'Files', key: 'files', width: 40 },
    { header: 'Avg Score', key: 'avgScore', width: 14 },
    { header: 'Judges', key: 'judgesCount', width: 9 },
    { header: 'Score per Judge', key: 'judgeScores', width: 28 },
    { header: 'Result', key: 'result', width: 22 },
  ]

  for (const d of orgDocs) {
    org.addRow({
      submittedAt: d.createdAt?.toISOString() || '',
      id: String(d._id),
      organizationName: d.organizationName || '',
      ownerName: d.ownerName || '',
      organizationEmail: d.organizationEmail || '',
      organizationNumber: d.organizationNumber || '',
      achievements: (d.achievements || [])
        .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description}`)
        .join('\n\n'),
      files: (d.achievements || [])
        .filter((a) => a.file?.filename)
        .map((a) => a.file.originalName || a.file.filename)
        .join('\n'),
      ...score(d),
    })
  }

  // Style headers on both sheets
  ;[personal, org].forEach((ws) => {
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A3F6B' },
    }
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
    // Enable wrap-text on achievements/files columns
    ws.eachRow((row) => {
      row.alignment = { vertical: 'top', wrapText: true }
    })
  })

  return wb
}