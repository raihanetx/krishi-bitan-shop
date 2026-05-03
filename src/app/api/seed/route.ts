import { log, logError } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { 
  categories, products, variants, productImages, productFaqs,
  coupons, settings
} from '@/db/schema'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'
import { eq, ne } from 'drizzle-orm'

// ============================================
// SEED API - Load Sample Data
// ============================================
// POST /api/seed - Insert demo products and categories
// Customize these to match YOUR business

const sampleCategories = [
  { id: 'cat-1', name: 'Category 1', type: 'icon', icon: 'ri-shopping-bag-line', image: '', items: 0, status: 'Active' },
  { id: 'cat-2', name: 'Category 2', type: 'icon', icon: 'ri-heart-line', image: '', items: 0, status: 'Active' },
]

const sampleProducts = [
  {
    id: 1,
    name: 'Sample Product',
    category: 'Category 1',
    categoryId: 'cat-1',
    image: '',
    price: '100',
    oldPrice: '120',
    discountType: 'pct',
    discountValue: '17',
    offer: true,
    status: 'active',
    shortDesc: 'A sample product — replace with your own.',
    longDesc: 'Replace this with your actual product description.',
    variants: [
      { name: 'Small', stock: 50, initialStock: 50, price: '100' },
      { name: 'Large', stock: 30, initialStock: 30, price: '180' },
    ],
  },
]

const sampleCoupons = [
  { id: 'coup-welcome', code: 'WELCOME', type: 'pct', value: '10', scope: 'all', expiry: '2026-12-31' },
]

/**
 * POST /api/seed
 * Load sample data into the database
 * Admin authentication required
 */
export async function POST(request: NextRequest) {
  try {
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json().catch(() => ({}))
    const { clearFirst = true } = body

    log('[SEED] Starting seed process...')

    if (clearFirst) {
      log('[SEED] Clearing existing data...')
      await db.delete(productFaqs)
      await db.delete(variants)
      await db.delete(products)
      await db.delete(categories)
      await db.delete(coupons)
      log('[SEED] Existing data cleared')
    }

    // Insert categories
    log('[SEED] Inserting categories...')
    const insertedCategories: any[] = []
    for (const cat of sampleCategories) {
      const result = await db.insert(categories).values({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        image: cat.image,
        items: cat.items,
        status: cat.status,
      }).onConflictDoUpdate({
        target: categories.id,
        set: { name: cat.name, image: cat.image, status: cat.status }
      }).returning()
      insertedCategories.push(result[0])
    }

    // Insert products with variants
    log('[SEED] Inserting products...')
    const insertedProducts: any[] = []
    const insertedVariants: any[] = []
    
    for (const prod of sampleProducts) {
      const productResult = await db.insert(products).values({
        name: prod.name,
        category: prod.category,
        categoryId: prod.categoryId,
        image: prod.image,
        price: prod.price,
        oldPrice: prod.oldPrice,
        discountType: prod.discountType,
        discountValue: prod.discountValue,
        offer: prod.offer,
        status: prod.status,
        shortDesc: prod.shortDesc,
        longDesc: prod.longDesc,
      }).returning()
      
      const insertedProduct = productResult[0]
      insertedProducts.push(insertedProduct)
      
      for (const v of prod.variants) {
        const variantResult = await db.insert(variants).values({
          name: v.name,
          stock: v.stock,
          initialStock: v.initialStock,
          price: v.price,
          discountType: 'pct',
          discountValue: '0',
          productId: insertedProduct.id,
        }).returning()
        insertedVariants.push(variantResult[0])
      }
      
      await db.update(categories)
        .set({ items: (insertedProducts.filter(p => p.categoryId === prod.categoryId).length) })
        .where(eq(categories.id, prod.categoryId))
    }

    // Insert coupons
    log('[SEED] Inserting coupons...')
    const insertedCoupons: any[] = []
    for (const coup of sampleCoupons) {
      const result = await db.insert(coupons).values({
        id: coup.id,
        code: coup.code,
        type: coup.type,
        value: coup.value,
        scope: coup.scope,
        expiry: coup.expiry,
      }).onConflictDoUpdate({
        target: coupons.id,
        set: { code: coup.code, value: coup.value, expiry: coup.expiry }
      }).returning()
      insertedCoupons.push(result[0])
    }

    log('[SEED] Seed completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Sample data loaded successfully!',
      data: {
        categories: insertedCategories.length,
        products: insertedProducts.length,
        variants: insertedVariants.length,
        coupons: insertedCoupons.length,
      }
    })
  } catch (error) {
    logError('[SEED] Seed failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load sample data. Please try again.' 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/seed
 * Clear all data (for reset)
 * Admin authentication required
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    log('[SEED] Starting data clear...')
    await db.delete(productFaqs)
    await db.delete(variants)
    await db.delete(products)
    await db.delete(categories)
    await db.delete(coupons)
    log('[SEED] Data cleared successfully!')

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully!',
    })
  } catch (error) {
    logError('[SEED] Clear failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear data. Please try again.' 
    }, { status: 500 })
  }
}
