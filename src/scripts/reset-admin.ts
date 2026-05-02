/**
 * Reset Admin Password Script
 * Run this script to reset the admin password
 *
 * Usage: npx tsx src/scripts/reset-admin.ts <new-password>
 *
 * SECURITY: Password argument is REQUIRED — no default fallback.
 * Password must meet strength requirements (8+ chars, upper, lower, number, special).
 */

import { db } from '../db'
import { settings } from '../db/schema'
import { hashPassword } from '../lib/auth'
import { isPasswordStrongEnough } from '../lib/password-strength'
import { eq } from 'drizzle-orm'

async function resetAdminPassword(newPassword: string) {
  console.log('🔐 Resetting admin password...')

  try {
    // Check if settings exist
    const existingSettings = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)

    if (existingSettings.length === 0) {
      console.log('❌ No settings found. Please run the seed script first:')
      console.log('   npx tsx src/scripts/seed.ts')
      process.exit(1)
    }

    // Validate password strength
    const strengthCheck = isPasswordStrongEnough(newPassword)
    if (!strengthCheck.valid) {
      console.log('❌ Password is too weak:', strengthCheck.error)
      console.log('   Requirements: 8+ characters, uppercase, lowercase, number, special character')
      process.exit(1)
    }

    const hashedPassword = await hashPassword(newPassword)

    await db.update(settings)
      .set({
        adminPassword: hashedPassword,
        adminPasswordUpdatedAt: new Date().toISOString(),
      })
      .where(eq(settings.id, 1))

    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ ADMIN PASSWORD RESET SUCCESSFULLY!')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log('📋 New Admin Credentials:')
    console.log('   Username:', existingSettings[0].adminUsername || 'admin')
    console.log('   Password: •••••••••• (hidden)')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

// Get password from command line argument — REQUIRED
const newPassword = process.argv[2]

if (!newPassword) {
  console.log('❌ Password argument is required!')
  console.log('')
  console.log('Usage: npx tsx src/scripts/reset-admin.ts <new-password>')
  console.log('')
  console.log('Password requirements:')
  console.log('  - Minimum 8 characters')
  console.log('  - At least one uppercase letter')
  console.log('  - At least one lowercase letter')
  console.log('  - At least one number')
  console.log('  - At least one special character (!@#$%^&*)')
  process.exit(1)
}

// Run reset
resetAdminPassword(newPassword)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Reset error:', error)
    process.exit(1)
  })
