import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * One judge's scores for one application. A judge submits once and cannot
 * change it (an admin can delete it to allow a new one), so
 * (applicationId, judgeId) is unique.
 */
const EvaluationSchema = new Schema(
  {
    applicationType: { type: String, enum: ['personal', 'organization'], required: true },
    applicationId: { type: Schema.Types.ObjectId, required: true, index: true },
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Kept as a copy so the admin still sees who scored if the account is removed.
    judgeName: { type: String, required: true },
    scores: { type: Map, of: Number, default: {} },
    total: { type: Number, required: true },
    maxTotal: { type: Number, required: true },
    comment: { type: String, default: '', trim: true, maxlength: 3000 },
  },
  { timestamps: true, collection: 'evaluations' }
)

EvaluationSchema.index({ applicationId: 1, judgeId: 1 }, { unique: true })

export const Evaluation = mongoose.model('Evaluation', EvaluationSchema)
