import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * Embedded sub-document for an achievement (used by both personal & org).
 * `file` stores filesystem metadata only — the actual file lives in /uploads.
 */
const AchievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    file: {
      filename: String,    // stored name on disk (uuid-prefixed)
      originalName: String,
      mimeType: String,
      size: Number,
      path: String,        // relative path under server/uploads
    },
  },
  { _id: false }
)

/**
 * Personal application
 */
const PersonalApplicationSchema = new Schema(
  {
    userType: { type: String, enum: ['self', 'referral'], required: true },

    // Referrer info — only present when userType === 'referral'
    referrer: {
      fullName: String,
      age: Number,
      gender: { type: String, enum: ['male', 'female'] },
      email: String,
      phone: String,
      nominationReason: String,
    },

    // Applicant
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['male', 'female'], required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },

    tribeChecked: { type: Boolean, default: false },
    specificAffiliation: { type: String, default: '' },

    achievements: { type: [AchievementSchema], default: [] },

    // Audit
    submittedAt: { type: Date, default: Date.now },
    submittedFromIp: String,
  },
  { timestamps: true, collection: 'personal_applications' }
)

/**
 * Organization application
 */
const OrganizationApplicationSchema = new Schema(
  {
    organizationName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    organizationEmail: { type: String, required: true, trim: true, lowercase: true },
    organizationNumber: { type: String, required: true, trim: true },

    achievements: { type: [AchievementSchema], default: [] },

    submittedAt: { type: Date, default: Date.now },
    submittedFromIp: String,
  },
  { timestamps: true, collection: 'organization_applications' }
)

export const PersonalApplication = mongoose.model(
  'PersonalApplication',
  PersonalApplicationSchema
)
export const OrganizationApplication = mongoose.model(
  'OrganizationApplication',
  OrganizationApplicationSchema
)