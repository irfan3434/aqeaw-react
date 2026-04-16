import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// uploads/ sits at the server root (one level above src/)
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 4)

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 40)
    const unique = crypto.randomBytes(6).toString('hex')
    cb(null, `${Date.now()}-${unique}-${safeBase}${ext}`)
  },
})

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.has(file.mimetype)) cb(null, true)
  else cb(new Error(`Unsupported file type: ${file.mimetype}`))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
})