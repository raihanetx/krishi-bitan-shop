import { log, logError } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { db, sqlClient } from '@/db'
import { productViews, cartEvents, products, orders, orderItems, categories } from '@/db/schema'
import { eq, sql, desc, and, gte, lte, inArray } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/analytics - Fetch analytics data (Protected: Admin only)
export async function GET(request: NextRequest) {
  // Authentication required for analytics access
  if (!await isApiAuthenticated()) {
    return authErrorResponse()
  }

  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    // ============================================
    // MOST VIEWED PRODUCTS — 2 queries (not N+1)
    // ============================================
    if (action === 'most-viewed') {
      const limit = parseInt(searchParams.get('limit') || '5')

      // Query 1: Get top viewed product IDs with aggregated counts
      const views = await db
        .select({
          productId: productViews.productId,
          totalViews: sql<number>`sum(${productViews.viewCount})`.as('totalViews'),
        })
        .from(productViews)
        .groupBy(productViews.productId)
        .orderBy(desc(sql`sum(${productViews.viewCount})`))
        .limit(limit)

      if (views.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      // Query 2: Batch fetch all products in ONE query
      const productIds = views.map(v => v.productId)
      const productsData = await db.select({
        id: products.id,
        name: products.name,
        category: products.category,
        image: products.image,
      }).from(products).where(inArray(products.id, productIds))

      // Build lookup map (O(1) access)
      const productMap = new Map(productsData.map(p => [p.id, p]))

      // Join in memory
      const result = views
        .map(v => {
          const product = productMap.get(v.productId)
          if (!product) return null
          return {
            id: v.productId,
            name: product.name,
            category: product.category,
            image: product.image,
            views: v.totalViews,
          }
        })
        .filter(Boolean)

      return NextResponse.json({ success: true, data: result })
    }

    // ============================================
    // MOST ADDED TO CART — 2 queries (not N+1)
    // ============================================
    if (action === 'most-in-cart') {
      const limit = parseInt(searchParams.get('limit') || '5')

      // Query 1: Get top cart product IDs with aggregated counts
      const cartAdditions = await db
        .select({
          productId: cartEvents.productId,
          totalAdds: sql<number>`count(*)`.as('totalAdds'),
        })
        .from(cartEvents)
        .where(eq(cartEvents.action, 'add'))
        .groupBy(cartEvents.productId)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)

      if (cartAdditions.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      // Query 2: Batch fetch all products in ONE query
      const productIds = cartAdditions.map(c => c.productId)
      const productsData = await db.select({
        id: products.id,
        name: products.name,
        category: products.category,
        image: products.image,
      }).from(products).where(inArray(products.id, productIds))

      const productMap = new Map(productsData.map(p => [p.id, p]))

      const result = cartAdditions
        .map(c => {
          const product = productMap.get(c.productId)
          if (!product) return null
          return {
            id: c.productId,
            name: product.name,
            category: product.category,
            image: product.image,
            adds: c.totalAdds,
          }
        })
        .filter(Boolean)

      return NextResponse.json({ success: true, data: result })
    }

    // ============================================
    // SALES CHART — 1 query with GROUP BY (not 7)
    // ============================================
    if (action === 'sales-chart') {
      const days = parseInt(searchParams.get('days') || '7')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (days - 1))
      startDate.setHours(0, 0, 0, 0)

      // Single query: GROUP BY date using PostgreSQL DATE()
      const rows = await sqlClient`
        SELECT 
          DATE(created_at) as day,
          COUNT(*)::int as order_count,
          COALESCE(SUM(total), 0)::numeric as revenue
        FROM orders
        WHERE status = 'approved'
          AND created_at >= ${startDate.toISOString()}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      ` as Array<{ day: string; order_count: number; revenue: string }>

      // Build a map for quick lookup
      const dataMap = new Map<string, { orders: number; revenue: number }>()
      for (const row of rows) {
        const dateStr = new Date(row.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dataMap.set(dateStr, {
          orders: row.order_count,
          revenue: Math.round(parseFloat(row.revenue) || 0),
        })
      }

      // Fill in all days (including zeros for days with no orders)
      const chartData: { day: string; revenue: number; orders: number }[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const data = dataMap.get(dateStr)
        chartData.push({
          day: dateStr,
          revenue: data?.revenue || 0,
          orders: data?.orders || 0,
        })
      }

      return NextResponse.json({ success: true, data: chartData })
    }

    // ============================================
    // REVENUE BY CATEGORY — 1 query with JOIN (not N+1)
    // ============================================
    if (action === 'revenue-by-category') {
      // Single query: JOIN order_items with products to get category + revenue
      const rows = await sqlClient`
        SELECT 
          p.category as category,
          SUM(ROUND(CAST(oi.base_price AS numeric) * oi.qty))::bigint as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'approved'
        GROUP BY p.category
        ORDER BY revenue DESC
        LIMIT 5
      ` as Array<{ category: string; revenue: string }>

      // Get total revenue for percentage calculation
      const totalResult = await sqlClient`
        SELECT COALESCE(SUM(total), 0)::numeric as total
        FROM orders
        WHERE status = 'approved'
      ` as Array<{ total: string }>
      const totalRevenue = Math.round(parseFloat(totalResult[0]?.total || '0'))

      const result = rows.map(row => ({
        category: row.category || 'Other',
        revenue: parseInt(row.revenue) || 0,
        percentage: totalRevenue > 0 ? Math.round((parseInt(row.revenue) / totalRevenue) * 100) : 0,
      }))

      return NextResponse.json({ success: true, data: result, totalRevenue })
    }

    // ============================================
    // DASHBOARD OVERVIEW — parallel queries
    // ============================================
    if (action === 'overview') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // All counts in parallel
      const [todayResult, approvedResult, pendingResult, customerResult] = await Promise.all([
        // Today's orders
        sqlClient`
          SELECT COUNT(*)::int as count,
                 COALESCE(SUM(CASE WHEN status = 'approved' THEN total ELSE 0 END), 0)::numeric as revenue
          FROM orders
          WHERE created_at >= ${today.toISOString()}
        `,
        // Approved totals
        sqlClient`
          SELECT COUNT(*)::int as count, COALESCE(SUM(total), 0)::numeric as revenue
          FROM orders WHERE status = 'approved'
        `,
        // Pending count
        sqlClient`SELECT COUNT(*)::int as count FROM orders WHERE status = 'pending'`,
        // Unique customers
        sqlClient`SELECT COUNT(DISTINCT phone)::int as count FROM orders`,
      ])

      return NextResponse.json({
        success: true,
        data: {
          totalRevenue: Math.round(parseFloat(approvedResult[0]?.revenue || '0')),
          totalOrders: approvedResult[0]?.count || 0,
          pendingOrders: pendingResult[0]?.count || 0,
          todayOrders: todayResult[0]?.count || 0,
          todayRevenue: Math.round(parseFloat(todayResult[0]?.revenue || '0')),
          totalCustomers: customerResult[0]?.count || 0,
        },
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 })
  } catch (error) {
    logError('Analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
    }, { status: 500 })
  }
}

// POST /api/analytics - Track analytics events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, productId } = body

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (type === 'view' && productId) {
      // Check if we already have a view record for today
      const existing = await db.select().from(productViews)
        .where(and(
          eq(productViews.productId, productId),
          eq(productViews.date, today)
        ))
        .limit(1)

      if (existing.length > 0) {
        // Increment view count
        await db.update(productViews)
          .set({
            viewCount: sql`${productViews.viewCount} + 1`,
          })
          .where(eq(productViews.id, existing[0].id))
      } else {
        // Create new view record
        await db.insert(productViews).values({
          productId,
          date: today,
          viewCount: 1,
        })
      }

      return NextResponse.json({ success: true })
    }

    if (type === 'cart-add' && productId) {
      await db.insert(cartEvents).values({
        productId,
        action: 'add',
        date: today,
      })

      return NextResponse.json({ success: true })
    }

    if (type === 'cart-remove' && productId) {
      await db.insert(cartEvents).values({
        productId,
        action: 'remove',
        date: today,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid tracking type',
    }, { status: 400 })
  } catch (error) {
    logError('Analytics tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track event',
    }, { status: 500 })
  }
}
