/**
 * Database Seed Script
 * Run this script to initialize the database with default values
 *
 * Usage: npx tsx src/scripts/seed.ts
 *
 * This creates:
 * - Default settings row
 * - Admin credentials must be set via /admin/setup or reset-admin.ts
 *
 * SECURITY: No hardcoded default passwords!
 */

import { db } from '../db'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Check if settings already exist
    const existingSettings = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)

    if (existingSettings.length > 0) {
      console.log('⚠️  Settings already exist.')
      console.log('   Admin username:', existingSettings[0].adminUsername || 'not set')
      console.log('   Admin password:', existingSettings[0].adminPassword ? '✅ configured' : '❌ NOT configured')
      
      if (!existingSettings[0].adminPassword) {
        console.log('')
        console.log('   ⚠️  Admin password not set. Please run:')
        console.log('   npx tsx src/scripts/reset-admin.ts <your-password>')
        console.log('   Or visit /admin/setup in your browser.')
      }
      return
    }

    // Create new settings with default values — NO password set
    console.log('📝 Creating default settings (admin password NOT set)...')

    await db.insert(settings).values({
      id: 1,
      websiteName: 'My Shop',
      slogan: 'Fresh from farm to your table',
      insideDhakaDelivery: '60',
      outsideDhakaDelivery: '120',
      freeDeliveryMin: '500',
      universalDelivery: false,
      universalDeliveryCharge: '60',
      adminUsername: 'admin',
      // adminPassword intentionally NOT set — must be configured via setup wizard
      heroAnimationSpeed: 3000,
      heroAnimationType: 'Fade',
      stockLowPercent: 25,
      stockMediumPercent: 50,
      courierEnabled: false,
      offerTitle: 'Offers',
      offerSlogan: 'Exclusive deals just for you',
      firstSectionName: 'Categories',
      firstSectionSlogan: 'Browse by category',
      secondSectionName: 'Offers',
      secondSectionSlogan: 'Exclusive deals for you',
      thirdSectionName: 'Featured',
      thirdSectionSlogan: 'Handpicked products',
    })

    console.log('✅ Default settings created successfully!')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log('⚠️  Admin password is NOT set. You must configure it:')
    console.log('')
    console.log('   Option 1: Visit /admin/setup in your browser')
    console.log('   Option 2: Run npx tsx src/scripts/reset-admin.ts <your-password>')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run seed
seed()
  .then(() => {
    console.log('🌱 Seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed error:', error)
    process.exit(1)
  })
