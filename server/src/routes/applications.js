import { Router } from 'express'
import { upload } from '../middleware/upload.js'
import {
  PersonalApplication,
  OrganizationApplication,
} from '../models/Application.js'
import { sendSubmissionNotification } from '../services/mailer.js'
import { uploadToGridFS } from '../services/gridfsStorage.js'

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

      const buildAchievements = async (titles, descs, fileList) => {
        const out = []
        for (let i = 0; i < titles.length; i++) {
          let fileData = undefined

          if (fileList[i] && fileList[i].buffer) {
            try {
              const result = await uploadToGridFS(
                fileList[i].buffer,
                fileList[i].originalname,
                fileList[i].mimetype
              )
              fileData = {
                fileId: result.fileId,
                filename: result.filename,
                originalName: fileList[i].originalname,
                mimeType: fileList[i].mimetype,
                size: result.size,
              }
              console.log(`[gridfs] Stored: ${result.filename} (${result.fileId})`)
            } catch (err) {
              console.error('[gridfs] Upload failed:', err)
              fileData = {
                filename: fileList[i].originalname,
                originalName: fileList[i].originalname,
                mimeType: fileList[i].mimetype,
                size: fileList[i].size,
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

        const achievements = await buildAchievements(titles, descs, uploaded)

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
          achievements,
          submittedFromIp: ip,
        })
        type = 'personal'
      } else {
        const titles = asArray(body['achievementTitleOrg[]'] ?? body.achievementTitleOrg)
        const descs = asArray(body['descriptionOrg[]'] ?? body.descriptionOrg)
        const uploaded = files['uploadOrg[]'] || []

        const achievements = await buildAchievements(titles, descs, uploaded)

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