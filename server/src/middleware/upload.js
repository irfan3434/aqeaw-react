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
  if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true)
  // Tagged so errorHandler.js can answer 400 with this message instead of a
  // generic 500 — a plain Error would be indistinguishable from a real fault.
  const err = new Error('Unsupported file type. Please upload a PDF, Word document, JPEG or PNG.')
  err.code = 'INVALID_FILE_TYPE'
  cb(err)
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
})