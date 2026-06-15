import multer from 'multer'

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 4)

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
])

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.has(file.mimetype)) cb(null, true)
  else cb(new Error(`Unsupported file type: ${file.mimetype}`))
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
})