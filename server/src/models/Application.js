import mongoose from 'mongoose'

const { Schema } = mongoose

const AchievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    file: {
      fileId: String,
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
    },
  },
  { _id: false }
)

const PersonalApplicationSchema = new Schema(
  {
    userType: { type: String, enum: ['self', 'referral'], required: true },
    referrer: {
      fullName: String,
      age: Number,
      gender: { type: String, enum: ['male', 'female'] },
      email: String,
      phone: String,
      nominationReason: String,
    },
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['male', 'female'], required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    tribeChecked: { type: Boolean, default: false },
    specificAffiliation: { type: String, default: '' },
    achievements: { type: [AchievementSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
    submittedFromIp: String,
  },
  { timestamps: true, collection: 'personal_applications' }
)

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