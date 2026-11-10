/**
 * List every dashboard account.
 *
 *   npm run user:list
 *
 * Read-only — it changes nothing.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

import { User } from '../src/models/User.js'

await mongoose.connect(process.env.MONGODB_URI)

const users = await User.find({}, { passwordHash: 0, otpHash: 0, otpPrevHash: 0 })
  .sort({ role: 1, username: 1 })
  .lean()

if (!users.length) {
  console.log('\nNo accounts yet. Create one with: npm run user:create\n')
} else {
  const pad = (s, n) => String(s ?? '').padEnd(n)
  const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : 'never')

  console.log()
  console.log(pad('USERNAME', 18) + pad('ROLE', 12) + pad('NAME', 24) + pad('EMAIL (2-step)', 26) + pad('STATUS', 10) + 'LAST LOGIN')
  console.log('-'.repeat(100))
  for (const u of users) {
    console.log(
      pad(u.username, 18) +
        pad(u.role, 12) +
        pad(u.name, 24) +
        pad(u.email || '-', 26) +
        pad(u.active ? 'active' : 'disabled', 10) +
        date(u.lastLoginAt)
    )
  }
  console.log()

  const supers = users.filter((u) => u.role === 'superadmin' && u.active).length
  if (!supers) {
    console.log('WARNING: no active superadmin, so nobody can manage accounts in the dashboard.')
    console.log('Promote one with: npm run user:role -- <username> superadmin\n')
  }
}

await mongoose.disconnect()
