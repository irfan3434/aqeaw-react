import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * Dashboard accounts. `admin` users see the full admin dashboard;
 * `judge` users only see the anonymized judging page.
 */
const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['superadmin', 'admin', 'judge'], required: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    // If set, login needs a 6-digit code sent to this address.
    email: { type: String, trim: true, lowercase: true, default: '' },
    otpHash: String,
    // Previous code, still accepted after a resend (in case the first email arrives late)
    otpPrevHash: String,
    otpExpiresAt: Date,
    otpAttempts: { type: Number, default: 0 },
    otpSentAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true, collection: 'dashboard_users' }
)

export const User = mongoose.model('User', UserSchema)
