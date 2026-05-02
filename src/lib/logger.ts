/**
 * Production-safe logger
 * Only logs in development mode to prevent information leakage in production.
 * 
 * Usage:
 *   import { log, logError } from '@/lib/logger'
 *   log('[SECTION] Debug message')        // Only in dev
 *   logError('[SECTION] Error:', error)   // Only in dev
 */

const isDev = process.env.NODE_ENV === 'development'

export function log(...args: any[]): void {
  if (isDev) {
    console.log(...args)
  }
}

export function logError(...args: any[]): void {
  if (isDev) {
    console.error(...args)
  }
}

export function logWarn(...args: any[]): void {
  if (isDev) {
    console.warn(...args)
  }
}
