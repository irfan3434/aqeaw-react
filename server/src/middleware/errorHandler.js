import multer from 'multer'

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 4)

/** Unmatched route — answer in JSON so clients never get Express's HTML page. */
export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` })
}

/**
 * The last middleware in the stack, and the reason upload limits work at all.
 *
 * Multer reports a rejected file by calling next(err), which skips the route's
 * own try/catch entirely. Without a handler here those fall through to
 * Express's default and come back as an HTML 500, so an applicant whose PDF is
 * a megabyte too big is told only "Submission failed. Please try again."
 *
 * Every branch returns JSON with a message the client can show as-is. Nothing
 * leaks a stack trace: unknown errors are logged server-side and answered with
 * a generic 500.
 */
export function errorHandler(err, req, res, next) {
  // A GridFS download may already be streaming — Express must finish that.
  if (res.headersSent) return next(err)

  const send = (status, error, extra) => res.status(status).json({ error, ...extra })

  // ---- Uploads ----
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return send(413, `File too large. Maximum ${MAX_FILE_SIZE_MB} MB per file.`, {
          code: err.code,
        })
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        return send(400, 'Too many files, or a file sent in an unexpected field.', {
          code: err.code,
        })
      default:
        return send(400, 'Upload rejected.', { code: err.code })
    }
  }
  if (err?.code === 'INVALID_FILE_TYPE') return send(400, err.message, { code: err.code })

  // ---- CORS ----
  if (err?.code === 'CORS_NOT_ALLOWED') return send(403, 'Origin not allowed')

  // ---- Body parsers ----
  if (err?.type === 'entity.too.large') return send(413, 'Request body is too large.')
  if (err instanceof SyntaxError && 'body' in err) return send(400, 'Invalid JSON body.')

  // ---- Mongoose ----
  if (err?.name === 'ValidationError') {
    const fields = Object.keys(err.errors || {})
    return send(
      400,
      'Some required details are missing or invalid.',
      fields.length ? { fields } : undefined
    )
  }
  if (err?.name === 'CastError') return send(400, 'Invalid identifier.')

  // Anything that deliberately set its own client-error status.
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500) {
    return send(err.status, err.message || 'Request rejected')
  }

  console.error('[error]', req.method, req.path, '-', err)
  send(500, 'Something went wrong')
}
