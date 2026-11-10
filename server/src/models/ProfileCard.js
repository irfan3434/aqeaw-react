import mongoose from 'mongoose'

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * A profile card shown on the homepage.
 * Admins create and edit them from /admin/profile-cards.
 * The photo is stored in GridFS (bucket "uploads"); photoId points to it.
 */
const ProfileCardSchema = new mongoose.Schema(
  {
    tag: { type: String, trim: true, maxlength: 40, default: '' },
    rank: { type: String, trim: true, maxlength: 80, default: '' },
    rname: { type: String, trim: true, maxlength: 80, default: '' },
    h1: { type: String, trim: true, maxlength: 160, default: '' },
    h2: { type: String, trim: true, maxlength: 160, default: '' },
    p1: { type: String, trim: true, maxlength: 2000, default: '' },
    p2: { type: String, trim: true, maxlength: 2000, default: '' },
    foot: { type: String, trim: true, maxlength: 80, default: '' },

    photoId: { type: mongoose.Schema.Types.ObjectId, default: null },
    mode: { type: String, enum: ['cutout', 'circle'], default: 'cutout' },
    variant: { type: String, enum: ['2'], default: '2' }, // one design only
    navy: { type: String, match: HEX, default: '#203859' },
    gold: { type: String, match: HEX, default: '#9C7B4A' },
    footc: { type: String, match: HEX, default: '#1A2332' },

    published: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'profile_cards' }
)

export const ProfileCard = mongoose.model('ProfileCard', ProfileCardSchema)
