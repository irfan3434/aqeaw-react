import { Router } from 'express'
import path from 'node:path'

import { PersonalApplication, OrganizationApplication } from '../models/Application.js'
import { Evaluation } from '../models/Evaluation.js'
import { CRITERIA, MAX_TOTAL, RATING_MIN, RATING_MAX, weightedTotal } from '../config/criteria.js'
import { requireJudge } from '../middleware/adminAuth.js'
import { encryptRef, decryptRef, candidateCode, identityTerms, maskText } from '../services/anonymize.js'
import { getGridFSReadStream, getGridFSFileInfo } from '../services/gridfsStorage.js'

/**
 * Judge-only API. Nothing returned here contains a candidate's name, email,
 * phone, age, gender, affiliation, referrer identity or real database id.
 */
const router = Router()

router.use('/judge', requireJudge)

function modelFor(type) {
  return type === 'personal' ? PersonalApplication : OrganizationApplication
}

async function loadByRef(ref) {
  const parsed = decryptRef(ref)
  if (!parsed) return null
  const doc = await modelFor(parsed.type).findById(parsed.id).lean()
  return doc ? { ...parsed, doc } : null
}

/**
 * Judges get the criteria WITH their weights, matching the published criteria
 * document, which states the weights and the formula and tells the judge they
 * fill only the rating column. The weighted score is derived from the rating,
 * so showing it tells the judge nothing the document doesn't already.
 *
 * Still withheld: anything about the candidate's identity, and any other
 * judge's ratings or totals.
 */
const JUDGE_CRITERIA = CRITERIA.map(({ key, max, scale, ar, en }) => ({ key, max, scale, ar, en }))

function serializeEvaluation(ev) {
  if (!ev) return null
  return {
    scores: Object.fromEntries(ev.scores instanceof Map ? ev.scores : Object.entries(ev.scores || {})),
    comment: ev.comment || '',
    // The judge's own weighted result, so a submitted evaluation shows the same
    // number the admin sees for it.
    total: ev.total,
    maxTotal: ev.maxTotal || MAX_TOTAL,
    updatedAt: ev.updatedAt,
  }
}

/* GET /judge/criteria */
router.get('/judge/criteria', (_req, res) => {
  res.json({ criteria: JUDGE_CRITERIA })
})

/* GET /judge/applications — anonymized list + this judge's progress */
router.get('/judge/applications', async (req, res) => {
  try {
    const [personal, orgs, mine] = await Promise.all([
      PersonalApplication.find({}, { achievements: 1, userType: 1, createdAt: 1 }).lean(),
      OrganizationApplication.find({}, { achievements: 1, createdAt: 1 }).lean(),
      Evaluation.find(
        { judgeId: req.user._id },
        { applicationId: 1, total: 1, maxTotal: 1 }
      ).lean(),
    ])
    const mineById = new Map(mine.map((e) => [String(e.applicationId), e]))

    const items = [
      ...personal.map((d) => ({ d, type: 'personal' })),
      ...orgs.map((d) => ({ d, type: 'organization' })),
    ]
      // Oldest first, so the order stays stable as new applications arrive.
      .sort((a, b) => new Date(a.d.createdAt).getTime() - new Date(b.d.createdAt).getTime())
      .map(({ d, type }, i) => {
        const ev = mineById.get(String(d._id))
        return {
          ref: encryptRef(type, d._id),
          code: candidateCode(d._id),
          // Position in the full list, numbered here rather than in the page so
          // it stays the same when a judge filters to "not scored yet".
          seq: i + 1,
          achievementsCount: (d.achievements || []).length,
          // Date only, never the time. The ordering already implies roughly when
          // each candidate applied; an exact timestamp would tie a code to a
          // person far more tightly.
          submittedOn: d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : null,
          // The judge's own score for this candidate, so the list can show it.
          // Never another judge's score, and never the combined average.
          myEvaluation: ev ? { done: true, total: ev.total, maxTotal: ev.maxTotal || MAX_TOTAL } : null,
        }
      })

    res.json({
      items,
      progress: { evaluated: items.filter((i) => i.myEvaluation).length, total: items.length },
    })
  } catch (err) {
    console.error('[judge/applications]', err)
    res.status(500).json({ error: 'Failed to load applications' })
  }
})

/* GET /judge/applications/:ref — anonymized detail + this judge's scores */
router.get('/judge/applications/:ref', async (req, res) => {
  try {
    const found = await loadByRef(req.params.ref)
    if (!found) return res.status(404).json({ error: 'Not found' })
    const { type, doc } = found
    const terms = identityTerms(doc)

    const ev = await Evaluation.findOne({ applicationId: doc._id, judgeId: req.user._id }).lean()

    res.json({
      ref: req.params.ref,
      code: candidateCode(doc._id),
      // Category is not sent to judges. The nomination text is shown under a neutral heading.
      nominationReason: type === 'personal' && doc.userType === 'referral'
        ? maskText(doc.referrer?.nominationReason || '', terms)
        : '',
      achievements: (doc.achievements || []).map((a, i) => ({
        index: i,
        title: maskText(a.title, terms),
        description: maskText(a.description, terms),
        file: a.file?.fileId
          ? {
              available: true,
              ext: path.extname(a.file.originalName || a.file.filename || '').toLowerCase(),
              size: a.file.size || null,
            }
          : a.file?.filename ? { available: false } : null,
      })),
      criteria: JUDGE_CRITERIA,
      maxTotal: MAX_TOTAL,
      myEvaluation: serializeEvaluation(ev),
    })
  } catch (err) {
    console.error('[judge/applications/:ref]', err)
    res.status(500).json({ error: 'Failed to load application' })
  }
})

/* GET /judge/applications/:ref/file/:index — attachment with a neutral filename */
router.get('/judge/applications/:ref/file/:index', async (req, res) => {
  try {
    const found = await loadByRef(req.params.ref)
    if (!found) return res.status(404).json({ error: 'Not found' })
    const idx = Number(req.params.index)
    const file = found.doc.achievements?.[idx]?.file
    if (!file?.fileId) return res.status(404).json({ error: 'File not found' })

    const info = await getGridFSFileInfo(file.fileId)
    if (!info) return res.status(404).json({ error: 'File not found' })

    const ext = path.extname(file.originalName || info.filename || '').toLowerCase()
    const name = `${candidateCode(found.doc._id)}-achievement-${idx + 1}${ext}`

    res.setHeader('Content-Type', info.contentType || file.mimeType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    if (info.length) res.setHeader('Content-Length', info.length)

    const stream = getGridFSReadStream(file.fileId)
    stream.on('error', (err) => {
      console.error('[judge/file] stream error:', err)
      if (!res.headersSent) res.status(500).json({ error: 'File read failed' })
      else res.end()
    })
    stream.pipe(res)
  } catch (err) {
    console.error('[judge/file]', err)
    if (!res.headersSent) res.status(500).json({ error: 'Failed to retrieve file' })
  }
})

/* PUT /judge/applications/:ref/evaluation   { scores: {key: n}, comment } */
router.put('/judge/applications/:ref/evaluation', async (req, res) => {
  try {
    const found = await loadByRef(req.params.ref)
    if (!found) return res.status(404).json({ error: 'Not found' })

    // A judge evaluates each candidate once; it cannot be changed afterwards.
    const LOCKED = { error: 'You have already evaluated this candidate. Evaluations cannot be changed.', locked: true }
    if (await Evaluation.exists({ applicationId: found.doc._id, judgeId: req.user._id })) {
      return res.status(409).json(LOCKED)
    }

    const input = req.body?.scores || {}
    const scores = {}
    for (const c of CRITERIA) {
      // The judge gives a whole-number rating from 1 to 5.
      const v = Number(input[c.key])
      if (!Number.isInteger(v) || v < RATING_MIN || v > RATING_MAX) {
        return res.status(400).json({ error: `Invalid rating for ${c.key} (${RATING_MIN}–${RATING_MAX})`, key: c.key })
      }
      scores[c.key] = v
    }
    // Weighted total out of 100: sum of (weight × rating) ÷ 5
    const total = weightedTotal(scores)
    const comment = String(req.body?.comment || '').slice(0, 3000)

    let ev
    try {
      ev = await Evaluation.create({
        applicationType: found.type,
        applicationId: found.doc._id,
        judgeId: req.user._id,
        judgeName: req.user.name,
        scores,
        total,
        maxTotal: MAX_TOTAL,
        comment,
      })
    } catch (err) {
      // Two submissions at the same time: the unique index keeps only the first.
      if (err?.code === 11000) return res.status(409).json(LOCKED)
      throw err
    }

    res.json({ ok: true, evaluation: serializeEvaluation(ev.toObject()) })
  } catch (err) {
    console.error('[judge/evaluation]', err)
    res.status(500).json({ error: 'Failed to save evaluation' })
  }
})

export default router
