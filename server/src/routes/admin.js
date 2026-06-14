import { Router } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

import {
  PersonalApplication,
  OrganizationApplication,
} from '../models/Application.js'
import { issueAdminToken, requireAdmin } from '../middleware/adminAuth.js'
import { buildApplicationsWorkbook } from '../services/excelExport.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

const router = Router()

/* -------------------------------------------------------------------------- */
/*  POST /admin/login                                                         */
/* -------------------------------------------------------------------------- */
router.post('/admin/login', (req, res) => {
  const { password } = req.body || {}
  const expected = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SECRET

  if (!expected || !secret) {
    console.error('[admin/login] ADMIN_PASSWORD or ADMIN_SECRET not set')
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  // Constant-time comparison to avoid timing leaks
  const a = Buffer.from(String(password || ''))
  const b = Buffer.from(expected)
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!ok) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const token = issueAdminToken(secret)
  res.json({ ok: true, token })
})

/* -------------------------------------------------------------------------- */
/*  All routes below require a valid admin token                              */
/* -------------------------------------------------------------------------- */
router.use('/admin', requireAdmin)

/* -------------------------------------------------------------------------- */
/*  GET /admin/stats                                                          */
/*  Small header numbers for the dashboard.                                   */
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
/*  Query params:                                                             */
/*    type          personal | organization | all   (default: all)            */
/*    search        full-text fuzzy match on name/email/org name              */
/*    affiliation   exact match on specificAffiliation (personal only)        */
/*    from, to      ISO date strings                                          */
/*    limit, skip   pagination (defaults: 50, 0)                              */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications', async (req, res) => {
  try {
    const {
      type = 'all',
      search = '',
      affiliation = '',
      from = '',
      to = '',
      limit = '50',
      skip = '0',
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

    if (affiliation) {
      personalFilter.specificAffiliation = affiliation
    }

    const lim = Math.min(Number(limit) || 50, 200)
    const off = Math.max(Number(skip) || 0, 0)

    const fetchPersonal = type === 'organization' ? [] : PersonalApplication
      .find(personalFilter, {
        fullName: 1,
        email: 1,
        phone: 1,
        userType: 1,
        specificAffiliation: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .lean()

    const fetchOrg = type === 'personal' ? [] : OrganizationApplication
      .find(orgFilter, {
        organizationName: 1,
        ownerName: 1,
        organizationEmail: 1,
        organizationNumber: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .lean()

    const [personal, orgs] = await Promise.all([fetchPersonal, fetchOrg])

    // Normalize into a single list for the UI
    const merged = [
      ...personal.map((d) => ({
        _id: d._id,
        type: 'personal',
        name: d.fullName,
        email: d.email,
        phone: d.phone,
        subtype: d.userType, // self / referral
        affiliation: d.specificAffiliation || '',
        createdAt: d.createdAt,
      })),
      ...orgs.map((d) => ({
        _id: d._id,
        type: 'organization',
        name: d.organizationName,
        email: d.organizationEmail,
        phone: d.organizationNumber,
        subtype: 'org',
        affiliation: '',
        createdAt: d.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(off, off + lim)

    res.json({
      items: merged,
      counts: { personal: personal.length, organization: orgs.length },
    })
  } catch (err) {
    console.error('[admin/applications]', err)
    res.status(500).json({ error: 'Failed to load applications' })
  }
})


/* -------------------------------------------------------------------------- */
/*  GET /admin/applications/export.xlsx                                       */
/*  Excel download — respects the same filters as /admin/applications.        */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications/export.xlsx', async (req, res) => {
  try {
    const { from = '', to = '', type = 'all' } = req.query

    const dateFilter = {}
    if (from) dateFilter.$gte = new Date(String(from))
    if (to) dateFilter.$lte = new Date(String(to))

    const personalFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}
    const orgFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}

    const [personal, orgs] = await Promise.all([
      type === 'organization' ? [] : PersonalApplication.find(personalFilter).sort({ createdAt: -1 }).lean(),
      type === 'personal' ? [] : OrganizationApplication.find(orgFilter).sort({ createdAt: -1 }).lean(),
    ])

    const wb = await buildApplicationsWorkbook(personal, orgs)

    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="applications-${stamp}.xlsx"`)
    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error('[admin/export]', err)
    if (!res.headersSent) res.status(500).json({ error: 'Export failed' })
  }
})



/* -------------------------------------------------------------------------- */
/*  GET /admin/applications/file/:filename                                    */
/*  Authenticated file download (admin only).                                 */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications/file/:filename', (req, res) => {
  const { filename } = req.params
  // Basic path-traversal guard
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' })
  }
  const filePath = path.join(UPLOAD_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.download(filePath)
})


/* -------------------------------------------------------------------------- */
/*  GET /admin/applications/:type/:id                                         */
/*  Full document for detail view. MUST be last — :type catches anything.     */
/* -------------------------------------------------------------------------- */
router.get('/admin/applications/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
    const Model = type === 'personal' ? PersonalApplication
      : type === 'organization' ? OrganizationApplication
      : null
    if (!Model) return res.status(400).json({ error: 'Invalid type' })

    const doc = await Model.findById(id).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ doc, type })
  } catch (err) {
    console.error('[admin/applications/:type/:id]', err)
    res.status(500).json({ error: 'Failed to load application' })
  }
})

export default router