import { NextResponse } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema'
import { sql } from 'drizzle-orm'

// Health check endpoint for load balancers and monitoring
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test database connection with a simple query
    await db.select({ count: sql<number>`1` }).from(products).limit(1)
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'connected',
      }
    }, { status: 200 })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 })
  }
}
