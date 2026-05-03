import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// ============================================
// DATABASE CONFIGURATION (LAZY INITIALIZATION)
// ============================================
// Connection is created on first use, NOT on import.
// This allows the build step to succeed without DATABASE_URL.

let _client: ReturnType<typeof postgres> | null = null
let _dbInstance: ReturnType<typeof drizzle> | null = null

function getClient() {
  if (_client) return _client
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const isProduction = process.env.NODE_ENV === 'production'

  _client = postgres(DATABASE_URL, { 
    ssl: 'require',
    max: isProduction ? 10 : 3,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: true,
    transform: {
      undefined: null
    }
  })
  
  return _client
}

function getDb() {
  if (_dbInstance) return _dbInstance
  const client = getClient()
  _dbInstance = drizzle(client, { schema })
  return _dbInstance
}

// Proxy that lazily initializes on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb()
    const value = (instance as any)[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})

export function getSqlClient() {
  return getClient()
}

// Also export as sqlClient for backward compatibility
// Must be callable (used as tagged template literal: sqlClient`SELECT 1`)
export const sqlClient = new Proxy(function() {}, {
  apply(_target, _thisArg, args) {
    const client = getClient()
    return (client as any)(...args)
  },
  get(_target, prop) {
    const client = getClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
}) as unknown as ReturnType<typeof postgres>

// ============================================
// AUTO-INITIALIZATION ON FIRST DB ACCESS
// ============================================

declare global {
  var __settingsCache: { data: any; timestamp: number } | undefined
  var __shopDataCache: { data: any; timestamp: number } | undefined
  var __dashboardCache: { data: any; timestamp: number; timeFrame: string } | undefined
  var __courierCredentials: { data: any; timestamp: number } | undefined
  var __dbAutoInitialized: boolean | undefined
}

// Auto-initialize on first import (fallback mechanism)
async function autoInitFallback() {
  if (globalThis.__dbAutoInitialized) return
  
  // Skip during build time (no DATABASE_URL)
  if (!process.env.DATABASE_URL) return
  
  try {
    const client = getClient()
    const result = await client`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'settings'
      LIMIT 1
    `
    
    if (result.length === 0) {
      console.log('[DB] Tables not found, running auto-init...')
      const { initializeDatabase } = await import('@/lib/auto-init')
      await initializeDatabase()
    }
    
    globalThis.__dbAutoInitialized = true
  } catch (error) {
    console.error('[DB] Auto-init fallback error:', error)
  }
}

// Run auto-init in background (non-blocking) — only at runtime
if (process.env.DATABASE_URL) {
  autoInitFallback().catch(console.error)
}

// ============================================
// Global caches that persist across requests
// ============================================

export function getCachedSettings() {
  return globalThis.__settingsCache || null
}

export function setCachedSettings(data: any) {
  globalThis.__settingsCache = { data, timestamp: Date.now() }
}

export function getCachedShopData() {
  return globalThis.__shopDataCache || null
}

export function setCachedShopData(data: any) {
  globalThis.__shopDataCache = { data, timestamp: Date.now() }
}

export function getCachedDashboard(timeFrame: string) {
  const cache = globalThis.__dashboardCache
  if (cache && cache.timeFrame === timeFrame) {
    return cache
  }
  return null
}

export function setCachedDashboard(data: any, timeFrame: string) {
  globalThis.__dashboardCache = { data, timestamp: Date.now(), timeFrame }
}

export function getCachedCourierCredentials() {
  return globalThis.__courierCredentials || null
}

export function setCachedCourierCredentials(data: any) {
  globalThis.__courierCredentials = { data, timestamp: Date.now() }
}

export function clearAllCaches() {
  globalThis.__settingsCache = undefined
  globalThis.__shopDataCache = undefined
  globalThis.__dashboardCache = undefined
  globalThis.__courierCredentials = undefined
}

export function clearShopDataCache() {
  globalThis.__shopDataCache = undefined
}

// Re-export schema
export * from './schema'
export type Database = typeof db
