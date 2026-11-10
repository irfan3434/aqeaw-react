/**
 * Change only an account's role.
 *
 *   npm run user:role -- <username> <superadmin|admin|judge>
 *
 * Unlike user:create, this leaves the password, email and active flag alone —
 * so promoting someone doesn't force a password reset or switch off their
 * two-step login.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

import { User } from '../src/models/User.js'

const ROLES = ['superadmin', 'admin', 'judge']
const [username, role] = process.argv.slice(2)

if (!username || !ROLES.includes(role)) {
  console.error(`Usage: npm run user:role -- <username> <${ROLES.join('|')}>`)
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)

async function fail(message) {
  console.error(message)
  await mongoose.disconnect()
  process.exit(1)
}

const user = await User.findOne({ username: String(username).trim().toLowerCase() })
if (!user) {
  await fail(`No account with username "${username}". See them all with: npm run user:list`)
}

if (user.role === role) {
  console.log(`"${user.username}" is already a ${role}. Nothing to do.`)
  await mongoose.disconnect()
  process.exit(0)
}

// Never leave the system with nobody who can manage accounts.
if (user.role === 'superadmin') {
  const others = await User.countDocuments({
    role: 'superadmin',
    active: true,
    _id: { $ne: user._id },
  })
  if (others === 0) {
    await fail('This is the last active superadmin — promote someone else before demoting them.')
  }
}

const before = user.role
user.role = role
await user.save()

console.log(`"${user.username}" (${user.name}): ${before} -> ${role}`)
if (!user.active) {
  console.log('Note: this account is disabled, so it still cannot sign in. Enable it in the dashboard.')
}

await mongoose.disconnect()
