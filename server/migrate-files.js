/**
 * migrate-files.js
 * 
 * One-time script to re-upload old submission files to GridFS.
 * 
 * Usage:
 *   cd server
 *   node migrate-files.js
 * 
 * What it does:
 *   1. Connects to MongoDB
 *   2. Finds all achievements that have file.filename but NO file.fileId
 *   3. Tries to match each one to a local file in ./migrate-files/ folder
 *   4. Uploads matched files to GridFS
 *   5. Updates the MongoDB document with the new fileId
 *   6. Prints a report of what was matched and what wasn't
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MIGRATE_DIR = path.join(__dirname, 'migrate-files')
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in .env')
  process.exit(1)
}

if (!fs.existsSync(MIGRATE_DIR)) {
  console.error(`ERROR: Folder not found: ${MIGRATE_DIR}`)
  console.error('Create it and put the 14 files inside.')
  process.exit(1)
}

// ---- GridFS helpers (inline so this script is self-contained) ----

function getBucket() {
  const db = mongoose.connection.db
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' })
}

async function uploadBuffer(bucket, buffer, storedName, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(storedName, {
      contentType: mimeType,
      metadata: { originalName },
    })
    stream.end(buffer)
    stream.on('finish', () => resolve(stream.id.toString()))
    stream.on('error', reject)
  })
}

// ---- Matching logic ----

/**
 * Try to match a MongoDB file record to a local file.
 * Matching priority:
 *   1. Exact originalName match
 *   2. originalName (decoded) match
 *   3. Partial match (local filename contains the originalName or vice versa)
 *   4. Partial match on the stored filename
 */
function findLocalFile(localFiles, dbFile) {
  const originalName = dbFile.originalName || ''
  const storedName = dbFile.filename || ''

  // Try exact match on originalName
  let match = localFiles.find((f) => f === originalName)
  if (match) return match

  // Try decoded match (email clients sometimes re-encode Arabic filenames)
  try {
    const decoded = decodeURIComponent(originalName)
    match = localFiles.find((f) => f === decoded)
    if (match) return match
  } catch {}

  // Try partial match — local file contains the original name or vice versa
  match = localFiles.find((f) => {
    const fLower = f.toLowerCase()
    const origLower = originalName.toLowerCase()
    return fLower.includes(origLower) || origLower.includes(fLower)
  })
  if (match) return match

  // Try partial match on stored filename (the multer-generated name)
  // Strip the timestamp-hash prefix to get the base name
  const baseName = storedName.replace(/^\d+-[a-f0-9]+-/, '')
  if (baseName) {
    match = localFiles.find((f) => {
      const fLower = f.toLowerCase()
      const baseLower = baseName.toLowerCase()
      return fLower.includes(baseLower) || baseLower.includes(fLower)
    })
    if (match) return match
  }

  return null
}

// ---- Main ----

async function main() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected.\n')

  const db = mongoose.connection.db
  const bucket = getBucket()

  // List local files
  const localFiles = fs.readdirSync(MIGRATE_DIR).filter((f) => {
    const stat = fs.statSync(path.join(MIGRATE_DIR, f))
    return stat.isFile() && stat.size > 0
  })
  console.log(`Found ${localFiles.length} files in migrate-files/:\n`)
  localFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`))
  console.log('')

  // Find all achievements with file but no fileId across both collections
  const collections = ['personal_applications', 'organization_applications']
  const toMigrate = []

  for (const collName of collections) {
    const coll = db.collection(collName)
    const docs = await coll.find({
      'achievements.file': { $exists: true },
    }).toArray()

    for (const doc of docs) {
      const applicantName = doc.fullName || doc.organizationName || 'Unknown'
      for (let i = 0; i < (doc.achievements || []).length; i++) {
        const ach = doc.achievements[i]
        if (ach.file && !ach.file.fileId && (ach.file.filename || ach.file.filePath)) {
          toMigrate.push({
            collection: collName,
            docId: doc._id,
            applicantName,
            achievementIndex: i,
            achievementTitle: ach.title,
            dbFile: {
              filename: ach.file.filename || '',
              originalName: ach.file.originalName || ach.file.filename || '',
              mimeType: ach.file.mimeType || 'application/pdf',
              filePath: ach.file.filePath || ach.file.path || '',
            },
          })
        }
      }
    }
  }

  console.log(`Found ${toMigrate.length} achievements with files but no fileId.\n`)

  if (toMigrate.length === 0) {
    console.log('Nothing to migrate!')
    await mongoose.disconnect()
    return
  }

  // Match and upload
  const results = { migrated: 0, unmatched: 0, errors: 0 }
  const unmatchedList = []
  const usedFiles = new Set()

  for (const item of toMigrate) {
    const { collection, docId, applicantName, achievementIndex, achievementTitle, dbFile } = item

    console.log(`--- ${applicantName} → Achievement #${achievementIndex + 1}: "${achievementTitle}" ---`)
    console.log(`    DB originalName: ${dbFile.originalName}`)
    console.log(`    DB filename:     ${dbFile.filename}`)

    // Find matching local file (exclude already-used files)
    const availableFiles = localFiles.filter((f) => !usedFiles.has(f))
    const matchedFile = findLocalFile(availableFiles, dbFile)

    if (!matchedFile) {
      console.log(`    ❌ NO MATCH FOUND\n`)
      unmatchedList.push(item)
      results.unmatched++
      continue
    }

    console.log(`    ✅ Matched to: ${matchedFile}`)
    usedFiles.add(matchedFile)

    // Read file and upload to GridFS
    try {
      const filePath = path.join(MIGRATE_DIR, matchedFile)
      const buffer = fs.readFileSync(filePath)
      const storedName = `migrated-${Date.now()}-${matchedFile.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)}`

      const fileId = await uploadBuffer(
        bucket,
        buffer,
        storedName,
        dbFile.originalName || matchedFile,
        dbFile.mimeType
      )

      console.log(`    📦 Uploaded to GridFS: ${fileId}`)

      // Update the MongoDB document
      const coll = db.collection(collection)
      const updatePath = `achievements.${achievementIndex}.file`
      await coll.updateOne(
        { _id: docId },
        {
          $set: {
            [`${updatePath}.fileId`]: fileId,
            [`${updatePath}.filename`]: storedName,
            [`${updatePath}.originalName`]: dbFile.originalName || matchedFile,
            [`${updatePath}.mimeType`]: dbFile.mimeType,
            [`${updatePath}.size`]: buffer.length,
          },
        }
      )

      console.log(`    💾 MongoDB updated\n`)
      results.migrated++
    } catch (err) {
      console.error(`    ❌ ERROR: ${err.message}\n`)
      results.errors++
    }
  }

  // Report
  console.log('\n========== MIGRATION REPORT ==========')
  console.log(`  Migrated:  ${results.migrated}`)
  console.log(`  Unmatched: ${results.unmatched}`)
  console.log(`  Errors:    ${results.errors}`)
  console.log(`  Total:     ${toMigrate.length}`)

  if (unmatchedList.length > 0) {
    console.log('\n  Unmatched files (need manual matching):')
    unmatchedList.forEach((item) => {
      console.log(`    - ${item.applicantName} → "${item.achievementTitle}"`)
      console.log(`      DB name: ${item.dbFile.originalName || item.dbFile.filename}`)
    })
    console.log('\n  To fix unmatched files:')
    console.log('  1. Rename the local file to match the "DB name" shown above')
    console.log('  2. Run this script again — it will skip already-migrated ones')
  }

  if (localFiles.length > usedFiles.size) {
    const unused = localFiles.filter((f) => !usedFiles.has(f))
    console.log(`\n  Unused local files (${unused.length}):`)
    unused.forEach((f) => console.log(`    - ${f}`))
  }

  console.log('\n=======================================')
  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})