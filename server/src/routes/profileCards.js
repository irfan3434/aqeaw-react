import { Router } from 'express'
import mongoose from 'mongoose'

import { ProfileCard } from '../models/ProfileCard.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import {
  uploadToGridFS,
  deleteFromGridFS,
  getGridFSReadStream,
  getGridFSFileInfo,
} from '../services/gridfsStorage.js'

const router = Router()

const TEXT_FIELDS = ['tag', 'rank', 'rname', 'h1', 'h2', 'p1', 'p2', 'foot']
const OTHER_FIELDS = ['mode', 'navy', 'gold', 'footc', 'published', 'order']
const PHOTO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

function toJSON(card) {
  const c = card.toObject ? card.toObject() : card
  return {
    ...c,
    _id: String(c._id),
    photoId: undefined,
    photoUrl: c.photoId ? `/profile-cards/photo/${c.photoId}?v=${new Date(c.updatedAt).getTime()}` : '',
  }
}

/** Copy allowed fields from the request body. */
function pickFields(body) {
  const out = {}
  for (const k of TEXT_FIELDS) if (typeof body[k] === 'string') out[k] = body[k]
  for (const k of OTHER_FIELDS) if (body[k] !== undefined) out[k] = body[k]
  return out
}

/** "data:image/png;base64,..." -> GridFS file id. Throws a 400-style error if invalid. */
async function savePhoto(dataUrl) {
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl))
  if (!m || !PHOTO_TYPES[m[1]]) throw Object.assign(new Error('Photo must be a PNG, JPEG or WebP image'), { status: 400 })
  const buffer = Buffer.from(m[2], 'base64')
  if (buffer.length > MAX_PHOTO_BYTES) throw Object.assign(new Error('Photo is too large (max 5 MB)'), { status: 400 })
  const { fileId } = await uploadToGridFS(buffer, `profile-card.${PHOTO_TYPES[m[1]]}`, m[1])
  return new mongoose.Types.ObjectId(fileId)
}

function sendError(res, err, label) {
  if (err.status === 400 || err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  console.error(`[profile-cards] ${label}`, err)
  res.status(500).json({ error: 'Something went wrong' })
}

/* -------------------------------------------------------------------------- */
/*  Public                                                                    */
/* -------------------------------------------------------------------------- */

/** GET /profile-cards — published cards for the homepage */
router.get('/profile-cards', async (_req, res) => {
  try {
    const cards = await ProfileCard.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean()
    res.json({ cards: cards.map(toJSON) })
  } catch (err) {
    sendError(res, err, 'list public')
  }
})

/** GET /profile-cards/photo/:id — only serves files that belong to a profile card */
router.get('/profile-cards/photo/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(404).end()
  try {
    const owner = await ProfileCard.exists({ photoId: id })
    if (!owner) return res.status(404).end()
    const info = await getGridFSFileInfo(id)
    if (!info) return res.status(404).end()
    res.set('Content-Type', info.contentType || 'image/png')
    res.set('Cache-Control', 'public, max-age=86400')
    getGridFSReadStream(id).on('error', () => res.status(404).end()).pipe(res)
  } catch (err) {
    sendError(res, err, 'photo')
  }
})

/* -------------------------------------------------------------------------- */
/*  Admin                                                                     */
/* -------------------------------------------------------------------------- */

router.use('/admin/profile-cards', requireAdmin)

/** GET /admin/profile-cards — all cards, including drafts */
router.get('/admin/profile-cards', async (_req, res) => {
  try {
    const cards = await ProfileCard.find({}).sort({ order: 1, createdAt: 1 }).lean()
    res.json({ cards: cards.map(toJSON) })
  } catch (err) {
    sendError(res, err, 'list admin')
  }
})

/** POST /admin/profile-cards — body: card fields, optional photo (data URL) */
router.post('/admin/profile-cards', async (req, res) => {
  let photoId = null
  try {
    const fields = pickFields(req.body || {})
    if (req.body?.photo) photoId = await savePhoto(req.body.photo)
    const card = await ProfileCard.create({ ...fields, photoId })
    res.status(201).json({ card: toJSON(card) })
  } catch (err) {
    if (photoId) deleteFromGridFS(String(photoId))
    sendError(res, err, 'create')
  }
})

/**
 * PATCH /admin/profile-cards/:id
 * photo: data URL = replace, '' = remove, missing = keep
 */
router.patch('/admin/profile-cards/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Not found' })
  let newPhotoId = null
  try {
    const card = await ProfileCard.findById(id)
    if (!card) return res.status(404).json({ error: 'Not found' })

    const oldPhotoId = card.photoId
    card.set({ ...pickFields(req.body || {}), variant: '2' })
    if (typeof req.body?.photo === 'string') {
      newPhotoId = req.body.photo ? await savePhoto(req.body.photo) : null
      card.photoId = newPhotoId
    }
    await card.save()

    if (typeof req.body?.photo === 'string' && oldPhotoId) deleteFromGridFS(String(oldPhotoId))
    res.json({ card: toJSON(card) })
  } catch (err) {
    if (newPhotoId) deleteFromGridFS(String(newPhotoId))
    sendError(res, err, 'update')
  }
})

/** DELETE /admin/profile-cards/:id */
router.delete('/admin/profile-cards/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Not found' })
  try {
    const card = await ProfileCard.findByIdAndDelete(id)
    if (!card) return res.status(404).json({ error: 'Not found' })
    if (card.photoId) deleteFromGridFS(String(card.photoId))
    res.json({ ok: true })
  } catch (err) {
    sendError(res, err, 'delete')
  }
})

export default router
