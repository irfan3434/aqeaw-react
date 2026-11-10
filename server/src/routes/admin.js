import { Router } from 'express'
import mongoose from 'mongoose'

import {
  PersonalApplication,
  OrganizationApplication,
} from '../models/Application.js'
import { Evaluation } from '../models/Evaluation.js'
import { User } from '../models/User.js'
import { CRITERIA, MAX_TOTAL } from '../config/criteria.js'
import { requireAdmin, requireSuperadmin } from '../middleware/adminAuth.js'
import { candidateCode } from '../services/anonymize.js'
import { hashPassword } from '../services/passwords.js'
import { Settings, getJudgingSettings, resultFor } from '../models/Settings.js'
import { buildApplicationsWorkbook } from '../services/excelExport.js'
import { getGridFSReadStream, getGridFSFileInfo } from '../services/gridfsStorage.js'

const router = Router()

/** Map of "<applicationId>" -> { avg, count, maxTotal } for the given ids */
async function evaluationSummaries(ids) {
  if (!ids.length) return new Map()
  const rows = await Evaluation.aggregate([
    { $match: { applicationId: { $in: ids.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
    { $sort: { judgeName: 1 } },
    {
      $group: {
        _id: '$applicationId',
        avg: { $avg: '$total' },
        count: { $sum: 1 },
        maxTotal: { $max: '$maxTotal' },
        judges: { $push: { name: '$judgeName', total: '$total' } },
      },
    },
  ])
  return new Map(rows.map((r) => [String(r._id), {
    avg: Math.round(r.avg * 10) / 10,
    count: r.count,
    maxTotal: r.maxTotal || MAX_TOTAL,
    judges: r.judges,
  }]))
}

/* -------------------------------------------------------------------------- */
/*  All routes below require a valid admin token                              */
/* -------------------------------------------------------------------------- */
router.use('/admin', requireAdmin)

/* -------------------------------------------------------------------------- */
/*  GET /admin/stats                                                          */
/* -------------------------------------------------------------------------- */
router.get('/admin/stats', async (_req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [personalTotal, orgTotal, personalThisWeek, orgThisWeek] = await Promise.all([
      PersonalApplication.countDocuments({}),
      OrganizationApplication.countDocuments({}),
      PersonalApplication.countDocuments({ createdAt: { $gte: weekAgo } }),
      OrganizationApplication.countDocuments({ createdAt: { $gte: weekAgo } }),
    ])
    res.json({
      total: personalTotal + orgTotal,
      personal: personalTotal,
      organization: orgTotal,
      thisWeek: personalThisWeek + orgThisWeek,
    })
  } catch (err) {
    console.error('[admin/stats]', err)
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

/* -------------------------------------------------------------------------- */
/*  GET /admin/applications                                                   */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications', async (req, res) => {
  try {
    const {
      type = 'all', search = '', affiliation = '',
      from = '', to = '', limit = '50', skip = '0',
      result = '', sort = 'date',
    } = req.query

    const dateFilter = {}
    if (from) dateFilter.$gte = new Date(String(from))
    if (to) dateFilter.$lte = new Date(String(to))

    const personalFilter = {}
    const orgFilter = {}

    if (Object.keys(dateFilter).length) {
      personalFilter.createdAt = dateFilter
      orgFilter.createdAt = dateFilter
    }
    if (search) {
      const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      personalFilter.$or = [{ fullName: re }, { email: re }, { phone: re }]
      orgFilter.$or = [{ organizationName: re }, { ownerName: re }, { organizationEmail: re }]
    }
    if (affiliation) personalFilter.specificAffiliation = affiliation

    const lim = Math.min(Number(limit) || 50, 200)
    const off = Math.max(Number(skip) || 0, 0)

    const fetchPersonal = type === 'organization' ? [] : PersonalApplication
      .find(personalFilter, { fullName: 1, email: 1, phone: 1, userType: 1, specificAffiliation: 1, createdAt: 1 })
      .sort({ createdAt: -1 }).lean()

    const fetchOrg = type === 'personal' ? [] : OrganizationApplication
      .find(orgFilter, { organizationName: 1, ownerName: 1, organizationEmail: 1, organizationNumber: 1, createdAt: 1 })
      .sort({ createdAt: -1 }).lean()

    const [personal, orgs] = await Promise.all([fetchPersonal, fetchOrg])

    const merged = [
      ...personal.map((d) => ({
        _id: d._id, type: 'personal', name: d.fullName, email: d.email,
        phone: d.phone, subtype: d.userType, affiliation: d.specificAffiliation || '', createdAt: d.createdAt,
      })),
      ...orgs.map((d) => ({
        _id: d._id, type: 'organization', name: d.organizationName, email: d.organizationEmail,
        phone: d.organizationNumber, subtype: 'org', affiliation: '', createdAt: d.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Scores are needed for every row before paging, so we can filter/sort by them.
    const [summaries, settings] = await Promise.all([
      evaluationSummaries(merged.map((m) => m._id)),
      getJudgingSettings(),
    ])
    let all = merged.map((m) => {
      const evaluation = summaries.get(String(m._id)) || null
      return { ...m, code: candidateCode(m._id), evaluation, result: resultFor(evaluation, settings) }
    })

    if (['winner', 'notWinner', 'pending'].includes(result)) all = all.filter((i) => i.result === result)
    if (sort === 'score') {
      // Highest average first; unscored candidates last
      all.sort((a, b) => (b.evaluation?.avg ?? -1) - (a.evaluation?.avg ?? -1))
    }

    const resultCounts = { winner: 0, notWinner: 0, pending: 0 }
    for (const m of merged) resultCounts[resultFor(summaries.get(String(m._id)), settings)] += 1

    res.json({
      items: all.slice(off, off + lim),
      counts: { personal: personal.length, organization: orgs.length },
      resultCounts,
      settings: { ...settings, maxTotal: MAX_TOTAL },
    })
  } catch (err) {
    console.error('[admin/applications]', err)
    res.status(500).json({ error: 'Failed to load applications' })
  }
})

/* -------------------------------------------------------------------------- */
/*  GET /admin/applications/export.xlsx                                       */
/*  MUST be before :type/:id                                                  */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications/export.xlsx', async (req, res) => {
  try {
    const { from = '', to = '', type = 'all' } = req.query
    const dateFilter = {}
    if (from) dateFilter.$gte = new Date(String(from))
    if (to) dateFilter.$lte = new Date(String(to))

    const filter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}

    const [personal, orgs] = await Promise.all([
      type === 'organization' ? [] : PersonalApplication.find(filter).sort({ createdAt: -1 }).lean(),
      type === 'personal' ? [] : OrganizationApplication.find(filter).sort({ createdAt: -1 }).lean(),
    ])

    const [summaries, settings] = await Promise.all([
      evaluationSummaries([...personal, ...orgs].map((d) => d._id)),
      getJudgingSettings(),
    ])
    const wb = await buildApplicationsWorkbook(personal, orgs, summaries, (e) => resultFor(e, settings))
    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="applications-${stamp}.xlsx"`)
    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error('[admin/export]', err)
    if (!res.headersSent) res.status(500).json({ error: 'Export failed' })
  }
})

/* -------------------------------------------------------------------------- */
/*  GET /admin/applications/file/:fileId                                      */
/*  Streams the file directly from GridFS (MongoDB).                          */
/*  MUST be before :type/:id                                                  */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params

    const fileInfo = await getGridFSFileInfo(fileId)
    if (!fileInfo) return res.status(404).json({ error: 'File not found' })

    const originalName = fileInfo.metadata?.originalName || fileInfo.filename || 'download'
    const contentType = fileInfo.contentType || 'application/octet-stream'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`)
    if (fileInfo.length) res.setHeader('Content-Length', fileInfo.length)

    const stream = getGridFSReadStream(fileId)
    stream.pipe(res)

    stream.on('error', (err) => {
      console.error('[admin/file] stream error:', err)
      if (!res.headersSent) res.status(500).json({ error: 'File read failed' })
    })
  } catch (err) {
    console.error('[admin/file]', err)
    if (!res.headersSent) res.status(500).json({ error: 'Failed to retrieve file' })
  }
})

/* -------------------------------------------------------------------------- */
/*  Dashboard accounts (admins + judges)                                      */
/* -------------------------------------------------------------------------- */
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const cleanEmail = (v) => String(v || '').trim().toLowerCase()
const ROLES = ['superadmin', 'admin', 'judge']

function publicUser(u) {
  return {
    _id: u._id, username: u.username, name: u.name, role: u.role, email: u.email || '',
    active: u.active, lastLoginAt: u.lastLoginAt || null, createdAt: u.createdAt,
  }
}

/* GET /admin/me — any signed-in dashboard user needs to know who they are. */
router.get('/admin/me', (req, res) => res.json({ user: publicUser(req.user) }))

/* -------------------------------------------------------------------------- */
/*  Everything below manages accounts, so it is superadmin-only. Admins get    */
/*  403 here while keeping the rest of the dashboard.                          */
/* -------------------------------------------------------------------------- */
router.use('/admin/users', requireSuperadmin)

router.get('/admin/users', async (_req, res) => {
  try {
    const [users, counts] = await Promise.all([
      User.find({}, { passwordHash: 0 }).sort({ role: 1, createdAt: 1 }).lean(),
      Evaluation.aggregate([{ $group: { _id: '$judgeId', count: { $sum: 1 } } }]),
    ])
    const byJudge = new Map(counts.map((c) => [String(c._id), c.count]))
    res.json({ users: users.map((u) => ({ ...publicUser(u), evaluations: byJudge.get(String(u._id)) || 0 })) })
  } catch (err) {
    console.error('[admin/users]', err)
    res.status(500).json({ error: 'Failed to load users' })
  }
})

router.post('/admin/users', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase()
    const name = String(req.body?.name || '').trim()
    const role = req.body?.role
    const password = String(req.body?.password || '')
    const email = cleanEmail(req.body?.email)

    if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' })
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'Username must be 3–32 characters: English letters, numbers, . _ -' })
    }
    if (!name) return res.status(400).json({ error: 'Name is required' })
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    if (await User.exists({ username })) return res.status(409).json({ error: 'Username already exists' })

    const user = await User.create({ username, name, role, email, passwordHash: await hashPassword(password) })
    res.status(201).json({ user: publicUser(user) })
  } catch (err) {
    console.error('[admin/users POST]', err)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

/**
 * Superadmin is the only role that can manage accounts, so losing the last
 * active one locks everybody out of account management. Admins are not
 * protected this way — a superadmin can always recreate them.
 */
async function isLastSuperadmin(user) {
  if (user.role !== 'superadmin' || !user.active) return false
  return (await User.countDocuments({ role: 'superadmin', active: true })) <= 1
}

router.patch('/admin/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' })
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'Not found' })

    const { name, password, active, role, email } = req.body || {}
    if (email != null && cleanEmail(email) && !EMAIL_RE.test(cleanEmail(email))) {
      return res.status(400).json({ error: 'Invalid email address' })
    }
    const demoting = active === false || (role && role !== 'superadmin')
    if (demoting && (await isLastSuperadmin(user))) {
      return res.status(400).json({ error: 'Cannot disable or demote the last superadmin' })
    }
    if (password != null && password !== '' && String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (typeof name === 'string' && name.trim()) user.name = name.trim()
    if (typeof active === 'boolean') user.active = active
    if (typeof email === 'string') user.email = cleanEmail(email)
    if (ROLES.includes(role)) user.role = role
    if (password != null && password !== '') user.passwordHash = await hashPassword(String(password))
    await user.save()
    res.json({ user: publicUser(user) })
  } catch (err) {
    console.error('[admin/users PATCH]', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.delete('/admin/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' })
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'Not found' })
    if (await isLastSuperadmin(user)) return res.status(400).json({ error: 'Cannot delete the last superadmin' })
    // Evaluations are kept (they store the judge's name) so scores aren't lost.
    await user.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    console.error('[admin/users DELETE]', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

/* -------------------------------------------------------------------------- */
/*  Judging result settings                                                   */
/* -------------------------------------------------------------------------- */
router.get('/admin/settings', async (_req, res) => {
  try {
    res.json({ settings: { ...(await getJudgingSettings()), maxTotal: MAX_TOTAL } })
  } catch (err) {
    console.error('[admin/settings]', err)
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

router.put('/admin/settings', async (req, res) => {
  try {
    const passScore = Number(req.body?.passScore)
    const minJudges = Number(req.body?.minJudges)
    if (!Number.isFinite(passScore) || passScore < 0 || passScore > MAX_TOTAL) {
      return res.status(400).json({ error: `Winning score must be between 0 and ${MAX_TOTAL}` })
    }
    if (!Number.isInteger(minJudges) || minJudges < 1 || minJudges > 50) {
      return res.status(400).json({ error: 'Minimum judges must be a whole number from 1 to 50' })
    }
    await Settings.updateOne({ key: 'judging' }, { $set: { passScore, minJudges } }, { upsert: true })
    res.json({ settings: { passScore, minJudges, maxTotal: MAX_TOTAL } })
  } catch (err) {
    console.error('[admin/settings PUT]', err)
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

/* -------------------------------------------------------------------------- */
/*  GET /admin/applications/:type/:id                                         */
/*  MUST be last — :type matches anything.                                    */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
    const Model = type === 'personal' ? PersonalApplication
      : type === 'organization' ? OrganizationApplication
      : null
    if (!Model) return res.status(400).json({ error: 'Invalid type' })

    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Not found' })
    const doc = await Model.findById(id).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const [evaluations, settings, summaries] = await Promise.all([
      Evaluation.find({ applicationId: doc._id }).sort({ updatedAt: -1 }).lean(),
      getJudgingSettings(),
      evaluationSummaries([doc._id]),
    ])
    res.json({
      result: resultFor(summaries.get(String(doc._id)), settings),
      settings,
      doc,
      type,
      code: candidateCode(doc._id),
      criteria: CRITERIA,
      maxTotal: MAX_TOTAL,
      evaluations: evaluations.map((e) => ({
        _id: e._id,
        judgeName: e.judgeName,
        scores: e.scores || {},
        total: e.total,
        maxTotal: e.maxTotal,
        comment: e.comment || '',
        updatedAt: e.updatedAt,
      })),
    })
  } catch (err) {
    console.error('[admin/applications/:type/:id]', err)
    res.status(500).json({ error: 'Failed to load application' })
  }
})

/* -------------------------------------------------------------------------- */
/*  Delete evaluations. The judge then sees the candidate as not scored       */
/*  again and can score it from scratch.                                      */
/* -------------------------------------------------------------------------- */

/* DELETE /admin/evaluations/:id — one judge's evaluation */
router.delete('/admin/evaluations/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' })
    const ev = await Evaluation.findByIdAndDelete(req.params.id).lean()
    if (!ev) return res.status(404).json({ error: 'Not found' })
    console.log(`[admin] ${req.user.username} deleted evaluation by "${ev.judgeName}" (${ev.total})`)
    res.json({ ok: true })
  } catch (err) {
    console.error('[admin/evaluations DELETE]', err)
    res.status(500).json({ error: 'Failed to delete evaluation' })
  }
})

/* DELETE /admin/applications/:type/:id/evaluations — all evaluations of one candidate */
router.delete('/admin/applications/:type/:id/evaluations', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' })
    const { deletedCount } = await Evaluation.deleteMany({ applicationId: req.params.id })
    console.log(`[admin] ${req.user.username} deleted ${deletedCount} evaluation(s) of ${req.params.id}`)
    res.json({ ok: true, deleted: deletedCount })
  } catch (err) {
    console.error('[admin/applications evaluations DELETE]', err)
    res.status(500).json({ error: 'Failed to delete evaluations' })
  }
})

export default router