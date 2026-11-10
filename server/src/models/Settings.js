import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * Judging result rules, editable by admins from the dashboard.
 * Stored as a single document with key "judging".
 */
const SettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    // Pass mark (out of MAX_TOTAL): the final average must be ABOVE this to pass
    passScore: { type: Number, default: 70, min: 0 },
    // How many judges must score a candidate before a result is shown
    minJudges: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true, collection: 'settings' }
)

export const Settings = mongoose.model('Settings', SettingsSchema)

export async function getJudgingSettings() {
  const doc = await Settings.findOne({ key: 'judging' }).lean()
  return { passScore: doc?.passScore ?? 70, minJudges: doc?.minJudges ?? 1 }
}

/** 'winner' | 'notWinner' | 'pending' (not enough judges yet) */
export function resultFor(summary, settings) {
  if (!summary || summary.count < settings.minJudges) return 'pending'
  // Above the pass mark = pass. Equal to or below it = fail.
  return summary.avg > settings.passScore ? 'winner' : 'notWinner'
}
