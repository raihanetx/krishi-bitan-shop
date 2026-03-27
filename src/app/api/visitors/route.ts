import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { visitorSessions } from '@/db/schema'
import { eq, sql, and, asc } from 'drizzle-orm'

// POST /api/visitors - Track visitor session with device info
// ============================================
// ARCHITECTURE:
// - visitorId: Persistent ID in localStorage (V-XXXXXX)
// - sessionId: Session ID in sessionStorage (S-XXXXXX), resets on browser close
// - isNewVisitor: TRUE if this is their FIRST EVER visit to the site
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { visitorId, sessionId, deviceType, browser, os, date } = body

    console.log('📥 [VISITORS API] Received:', { visitorId, sessionId, deviceType, browser, os, date })

    if (!sessionId || !deviceType || !browser || !os) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const today = date || new Date().toISOString().split('T')[0]

    // Check if this session already tracked today
    const existingSession = await db.select().from(visitorSessions)
      .where(and(
        eq(visitorSessions.sessionId, sessionId),
        eq(visitorSessions.date, today)
      ))
      .limit(1)

    if (existingSession.length > 0) {
      console.log('✅ [VISITORS API] Session already tracked today')
      return NextResponse.json({ 
        success: true, 
        message: 'Session already tracked today',
        visitorId: existingSession[0].visitorId,
        sessionId: existingSession[0].sessionId,
        isNew: existingSession[0].isNewVisitor
      })
    }

    // ============================================
    // DETERMINE NEW vs RETURNING VISITOR
    // ============================================
    // A visitor is "NEW" if we have NEVER seen their visitorId before
    // A visitor is "RETURNING" if we have seen their visitorId on a PREVIOUS day
    // ============================================
    
    let isActuallyNew = true // Default: new visitor

    if (visitorId) {
      // Check if we've EVER seen this visitorId before (any date)
      const allPreviousVisits = await db.select()
        .from(visitorSessions)
        .where(eq(visitorSessions.visitorId, visitorId))
        .orderBy(asc(visitorSessions.date))
        .limit(1)

      if (allPreviousVisits.length > 0) {
        // Found previous visit - this is a RETURNING visitor
        const firstVisitDate = allPreviousVisits[0].date
        isActuallyNew = false
        console.log('🔄 [VISITORS API] Returning visitor:', visitorId, '| First visit:', firstVisitDate)
      } else {
        // Never seen before - this is a NEW visitor
        isActuallyNew = true
        console.log('🆕 [VISITORS API] New visitor:', visitorId)
      }
    } else {
      // No visitorId provided - treat as new session without persistent tracking
      console.log('⚠️ [VISITORS API] No visitorId provided, treating as new')
    }

    // Insert new session record
    const newSession = await db.insert(visitorSessions).values({
      visitorId: visitorId || null,
      sessionId,
      deviceType,
      browser,
      os,
      isNewVisitor: isActuallyNew,
      date: today,
    }).returning()

    console.log('✅ [VISITORS API] Tracked:', { 
      visitorId: newSession[0].visitorId,
      sessionId: newSession[0].sessionId, 
      isNew: newSession[0].isNewVisitor,
      date: today
    })

    return NextResponse.json({ 
      success: true,
      visitorId: newSession[0].visitorId,
      sessionId: newSession[0].sessionId,
      isNew: newSession[0].isNewVisitor
    })
  } catch (error) {
    console.error('[VISITORS API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track visitor'
    }, { status: 500 })
  }
}

// GET /api/visitors - Get visitor stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Get device type breakdown
    const deviceStats = await db.execute(sql`
      SELECT device_type, COUNT(DISTINCT session_id) as count 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      GROUP BY device_type
    `)

    // Get browser breakdown
    const browserStats = await db.execute(sql`
      SELECT browser, COUNT(DISTINCT session_id) as count 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      GROUP BY browser
    `)

    // Get OS breakdown
    const osStats = await db.execute(sql`
      SELECT os, COUNT(DISTINCT session_id) as count 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      GROUP BY os
    `)

    // Total unique visitors by visitorId (persistent ID)
    const totalVisitorsResult = await db.execute(sql`
      SELECT COUNT(DISTINCT visitor_id) as total 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      AND visitor_id IS NOT NULL
    `) as any

    // Total sessions
    const totalSessionsResult = await db.execute(sql`
      SELECT COUNT(*) as total 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
    `) as any

    // New vs Returning visitors (using isNewVisitor field)
    const newVsReturningResult = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN is_new_visitor = true THEN 1 END) as new_visitors,
        COUNT(CASE WHEN is_new_visitor = false THEN 1 END) as returning_visitors
      FROM (
        SELECT DISTINCT visitor_id, is_new_visitor
        FROM visitor_sessions
        WHERE date >= ${startDateStr}
        AND visitor_id IS NOT NULL
      ) sub
    `) as any

    const totalVisitors = totalVisitorsResult.rows?.[0]?.total || totalVisitorsResult[0]?.total || 0
    const totalSessions = totalSessionsResult.rows?.[0]?.total || totalSessionsResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: {
        totalVisitors,
        totalSessions,
        newVisitors: newVsReturningResult.rows?.[0]?.new_visitors || newVsReturningResult[0]?.new_visitors || 0,
        returningVisitors: newVsReturningResult.rows?.[0]?.returning_visitors || newVsReturningResult[0]?.returning_visitors || 0,
        devices: (deviceStats as any).rows || deviceStats,
        browsers: (browserStats as any).rows || browserStats,
        os: (osStats as any).rows || osStats,
      }
    })
  } catch (error) {
    console.error('Visitor stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get visitor stats'
    }, { status: 500 })
  }
}
