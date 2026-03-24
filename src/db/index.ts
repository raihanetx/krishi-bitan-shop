import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// ============================================
// DATABASE CONFIGURATION
// ============================================
// Get database URL from environment variable ONLY
// NEVER hardcode credentials in source code
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create postgres connection
const client = postgres(DATABASE_URL, { 
  ssl: 'require',
  max: 1
})
const dbInstance = drizzle(client, { schema })

export const db = dbInstance

// ============================================
// Global caches that persist across requests
// ============================================

declare global {
  var __settingsCache: { data: any; timestamp: number } | undefined
  var __shopDataCache: { data: any; timestamp: number } | undefined
  var __dashboardCache: { data: any; timestamp: number; timeFrame: string } | undefined
  var __courierCredentials: { data: any; timestamp: number } | undefined
}

// Cache getters/setters
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

// Clear all caches (useful for testing or forced refresh)
export function clearAllCaches() {
  globalThis.__settingsCache = undefined
  globalThis.__shopDataCache = undefined
  globalThis.__dashboardCache = undefined
  globalThis.__courierCredentials = undefined
}

// Re-export schema
export * from './schema'
export type Database = typeof db
