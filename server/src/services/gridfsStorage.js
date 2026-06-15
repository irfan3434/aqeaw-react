import mongoose from 'mongoose'
import { Readable } from 'node:stream'

/**
 * GridFS file storage — stores file buffers directly in MongoDB.
 * Uses the 'uploads' bucket (creates collections: uploads.files + uploads.chunks).
 * No external services needed — everything stays in Atlas.
 */

let bucket = null

function getBucket() {
  if (bucket) return bucket
  const db = mongoose.connection.db
  if (!db) throw new Error('MongoDB not connected yet')
  bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' })
  return bucket
}

/**
 * Upload a buffer to GridFS.
 * @param {Buffer} buffer
 * @param {string} originalName - the user's filename
 * @param {string} mimeType
 * @returns {Promise<{fileId: string, filename: string, size: number}>}
 */
export function uploadToGridFS(buffer, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    const b = getBucket()
    const timestamp = Date.now()
    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80)
    const storedName = `${timestamp}-${safeName}`

    const stream = b.openUploadStream(storedName, {
      contentType: mimeType,
      metadata: { originalName },
    })

    const readable = Readable.from(buffer)
    readable.pipe(stream)

    stream.on('finish', () => {
      resolve({
        fileId: stream.id.toString(),
        filename: storedName,
        size: buffer.length,
      })
    })

    stream.on('error', reject)
  })
}

/**
 * Get a readable stream for a file stored in GridFS.
 * @param {string} fileId - the GridFS ObjectId as a string
 * @returns {import('stream').Readable}
 */
export function getGridFSReadStream(fileId) {
  const b = getBucket()
  const objectId = new mongoose.Types.ObjectId(fileId)
  return b.openDownloadStream(objectId)
}

/**
 * Get file metadata from GridFS.
 * @param {string} fileId
 * @returns {Promise<object|null>}
 */
export async function getGridFSFileInfo(fileId) {
  const b = getBucket()
  const objectId = new mongoose.Types.ObjectId(fileId)
  const cursor = b.find({ _id: objectId })
  const files = await cursor.toArray()
  return files[0] || null
}

/**
 * Read a file from GridFS into a Buffer (for email attachments).
 * @param {string} fileId
 * @returns {Promise<Buffer>}
 */
export function readGridFSToBuffer(fileId) {
  return new Promise((resolve, reject) => {
    const stream = getGridFSReadStream(fileId)
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

/**
 * Delete a file from GridFS. Fire-and-forget.
 * @param {string} fileId
 */
export async function deleteFromGridFS(fileId) {
  try {
    const b = getBucket()
    const objectId = new mongoose.Types.ObjectId(fileId)
    await b.delete(objectId)
  } catch (err) {
    console.error('[gridfs] delete failed:', err)
  }
}