/**
 * Create or reset a dashboard account from the command line.
 *
 *   npm run user:create -- <username> <role: superadmin|admin|judge> "<Full Name>" <password> [email]
 *
 * With an email, login also needs a 6-digit code sent to that address.
 *
 * If the username exists, its name/role/password are updated and it is re-enabled.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

import { User } from '../src/models/User.js'
import { hashPassword } from '../src/services/passwords.js'

const [username, role, name, password, email = ''] = process.argv.slice(2)

if (!username || !['superadmin', 'admin', 'judge'].includes(role) || !name || !password || password.length < 8) {
  console.error('Usage: npm run user:create -- <username> <superadmin|admin|judge> "<Full Name>" <password (8+ chars)> [email]')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)
const passwordHash = await hashPassword(password)
const user = await User.findOneAndUpdate(
  { username: username.trim().toLowerCase() },
  { $set: { name, role, passwordHash, active: true, email: email.trim().toLowerCase() } },
  { upsert: true, new: true }
)
console.log(`Saved ${user.role} "${user.username}" (${user.name})${user.email ? ` — code sent to ${user.email} at login` : ''}`)
await mongoose.disconnect()
