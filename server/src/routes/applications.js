import { Router } from 'express'
import path from 'node:path'
import { upload } from '../middleware/upload.js'
import {
  PersonalApplication,
  OrganizationApplication,
} from '../models/Application.js'
import { sendSubmissionNotification } from '../services/mailer.js'

const router = Router()

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

      const buildAchievements = (titles, descs, fileList) => {
        const out = []
        for (let i = 0; i < titles.length; i++) {
          out.push({
            title: titles[i] || '',
            description: descs[i] || '',
            file: fileList[i]
              ? {
                  filename: fileList[i].filename,
                  originalName: fileList[i].originalname,
                  mimeType: fileList[i].mimetype,
                  size: fileList[i].size,
                  path: path.join('uploads', fileList[i].filename),
                }
              : undefined,
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
          specificAffiliation: body.specificAffiliation || '',
          achievements: buildAchievements(titles, descs, uploaded),
          submittedFromIp: ip,
        })
        type = 'personal'
      } else {
        const titles = asArray(body['achievementTitleOrg[]'] ?? body.achievementTitleOrg)
        const descs = asArray(body['descriptionOrg[]'] ?? body.descriptionOrg)
        const uploaded = files['uploadOrg[]'] || []

        doc = await OrganizationApplication.create({
          organizationName: body.organizationName,
          ownerName: body.ownerName,
          organizationEmail: body.organizationEmail,
          organizationNumber: body.organizationNumber,
          achievements: buildAchievements(titles, descs, uploaded),
          submittedFromIp: ip,
        })
        type = 'organization'
      }

      // Respond immediately — don't make the user wait for SMTP.
      res.status(201).json({ ok: true, id: doc._id, type })

      // Fire-and-forget email notification. Any error is logged inside mailer.
      sendSubmissionNotification(doc, type).catch((err) => {
        console.error('[submit-application] mailer threw:', err)
      })
    } catch (err) {
      console.error('[submit-application] error:', err)
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'A file exceeds the maximum allowed size.' })
      }
      // Only send a response if headers weren't already flushed
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Failed to save application.' })
      }
    }
  }
)

export default router