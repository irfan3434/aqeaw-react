import { Router } from 'express'
import { upload } from '../middleware/upload.js'
import {
  PersonalApplication,
  OrganizationApplication,
} from '../models/Application.js'
import { sendSubmissionNotification, sendJudgeNewApplicationNotice } from '../services/mailer.js'
import { uploadToGridFS } from '../services/gridfsStorage.js'
import { User } from '../models/User.js'
import { candidateCode } from '../services/anonymize.js'
import { normalizeAffiliation } from '../config/affiliations.js'

const router = Router()

/**
 * Email every active judge who has an address on file. Judges without one
 * simply aren't notified — they still see the candidate when they sign in.
 */
async function notifyJudges(doc) {
  const judges = await User.find(
    { role: 'judge', active: true, email: { $nin: ['', null] } },
    { name: 1, email: 1 }
  ).lean()
  if (!judges.length) return
  await sendJudgeNewApplicationNotice(judges, candidateCode(doc._id))
}

router.post(
  '/submit-application',
  upload.fields([
    { name: 'upload[]', maxCount: 4 },
    { name: 'uploadOrg[]', maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const body = req.body
      const files = req.files || {}
      const formType = body.formType

      if (formType !== 'personal' && formType !== 'organization') {
        return res.status(400).json({ error: 'Invalid or missing formType' })
      }

      const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v])

      /**
       * Decide which achievement each uploaded file belongs to.
       *
       * The form only sends a file for the achievements that actually have
       * one, so the Nth file is not necessarily the Nth achievement. Pairing
       * them by position meant that attaching a document to the second
       * achievement stored it against the first — silently, and with a judge
       * later reading a document that described something else entirely.
       *
       * The form now sends a parallel `uploadIndex[]` naming the slot each
       * file belongs to. Anything that doesn't send usable indexes — a page
       * cached from before this deploy, or a hand-made request — falls back to
       * the old positional pairing, so a submission is never rejected over it.
       */
      const mapFilesToSlots = (fileList, rawIndexes) => {
        const parsed = asArray(rawIndexes).map(Number)
        const usable =
          parsed.length === fileList.length &&
          parsed.every((n) => Number.isInteger(n) && n >= 0)
        if (!usable && parsed.length) {
          console.warn(
            `[submit-application] uploadIndex[] unusable (${parsed.length} for ` +
              `${fileList.length} files) — pairing files by position`
          )
        }
        const slots = new Map()
        fileList.forEach((file, i) => {
          const slot = usable ? parsed[i] : i
          // First file wins a slot; a duplicate index would otherwise discard
          // the attachment the applicant actually chose first.
          if (!slots.has(slot)) slots.set(slot, file)
        })
        return slots
      }

      const buildAchievements = async (titles, descs, fileList, rawIndexes) => {
        const slots = mapFilesToSlots(fileList, rawIndexes)
        const out = []
        for (let i = 0; i < titles.length; i++) {
          let fileData = undefined
          const chosen = slots.get(i)

          if (chosen && chosen.buffer) {
            try {
              const result = await uploadToGridFS(
                chosen.buffer,
                chosen.originalname,
                chosen.mimetype
              )
              fileData = {
                fileId: result.fileId,
                filename: result.filename,
                originalName: chosen.originalname,
                mimeType: chosen.mimetype,
                size: result.size,
              }
              console.log(`[gridfs] Stored: ${result.filename} (${result.fileId})`)
            } catch (err) {
              console.error('[gridfs] Upload failed:', err)
              fileData = {
                filename: chosen.originalname,
                originalName: chosen.originalname,
                mimeType: chosen.mimetype,
                size: chosen.size,
              }
            }
          }

          out.push({
            title: titles[i] || '',
            description: descs[i] || '',
            file: fileData,
          })
        }
        return out
      }

      const ip = req.ip
      let doc
      let type

      if (formType === 'personal') {
        const userType = body.userType === 'referral' ? 'referral' : 'self'
        const titles = asArray(body['achievementTitle[]'] ?? body.achievementTitle)
        const descs = asArray(body['description[]'] ?? body.description)
        const uploaded = files['upload[]'] || []

        const achievements = await buildAchievements(
          titles,
          descs,
          uploaded,
          body['uploadIndex[]'] ?? body.uploadIndex
        )

        doc = await PersonalApplication.create({
          userType,
          referrer:
            userType === 'referral'
              ? {
                  fullName: body.referrerFullName,
                  age: Number(body.referrerAge) || undefined,
                  gender: body.referrerGender,
                  email: body.referrerEmail,
                  phone: body.referrerPhone,
                  nominationReason: body.nominationReason,
                }
              : undefined,
          fullName: body.fullName,
          age: Number(body.applicantAge),
          gender: body.applicantGender,
          email: body.email,
          phone: body.phone,
          tribeChecked: body.tribeCheckbox === 'on',
          // Stored as a stable code rather than whichever translated label
          // the applicant happened to be reading. Labels posted by an older
          // form are converted here, so both spellings end up as one value.
          specificAffiliation: normalizeAffiliation(body.specificAffiliation),
          achievements,
          submittedFromIp: ip,
        })
        type = 'personal'
      } else {
        const titles = asArray(body['achievementTitleOrg[]'] ?? body.achievementTitleOrg)
        const descs = asArray(body['descriptionOrg[]'] ?? body.descriptionOrg)
        const uploaded = files['uploadOrg[]'] || []

        const achievements = await buildAchievements(
          titles,
          descs,
          uploaded,
          body['uploadIndexOrg[]'] ?? body.uploadIndexOrg
        )

        doc = await OrganizationApplication.create({
          organizationName: body.organizationName,
          ownerName: body.ownerName,
          organizationEmail: body.organizationEmail,
          organizationNumber: body.organizationNumber,
          achievements,
          submittedFromIp: ip,
        })
        type = 'organization'
      }

      res.status(201).json({ ok: true, id: doc._id, type })

      sendSubmissionNotification(doc, type).catch((err) => {
        console.error('[submit-application] mailer threw:', err)
      })

      // Tell the judges there is something to score. Runs after the response,
      // so a slow or broken mail server can never fail a submission.
      notifyJudges(doc).catch((err) => {
        console.error('[submit-application] judge notice threw:', err)
      })
    } catch (err) {
      console.error('[submit-application] error:', err)
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'A file exceeds the maximum allowed size.' })
      }
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Failed to save application.' })
      }
    }
  }
)

export default router