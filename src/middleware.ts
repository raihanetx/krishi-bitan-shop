import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

// ============================================
// CSRF PROTECTION — Middleware-level validation
// ============================================
// Exempt routes that are intentionally public or have their own auth
const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',        // Has honeypot + rate limiting + bcrypt
  '/api/auth/logout',       // Session cookie action
  '/api/auth/session',      // Read-only
  '/api/courier/webhook',   // Has Bearer token auth
  '/api/csrf',              // The CSRF token endpoint itself
  '/api/setup',             // Initial setup, no session yet
  '/api/orders',            // Public order creation (has bot detection + rate limiting)
  '/api/reviews',           // Public review submission
  '/api/tracking/',         // Public visitor tracking
  '/api/visitors',          // Public visitor tracking
  '/api/analytics',         // Public analytics tracking
  '/api/abandoned',         // Public abandoned checkout tracking
  '/api/health',            // Read-only health check
  '/api/test-connection',   // Has its own auth check
  '/api/shop-data',         // GET is public, POST has auth check
]

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exempt => pathname.startsWith(exempt))
}

function validateCsrf(request: NextRequest): boolean {
  // Get token from cookie (set by GET /api/csrf)
  const cookieToken = request.cookies.get('csrf_token')?.value
  // Get token from header (sent by client)
  const headerToken = request.headers.get('x-csrf-token')

  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  try {
    const cookieBuf = Buffer.from(cookieToken, 'hex')
    const headerBuf = Buffer.from(headerToken, 'hex')

    if (cookieBuf.length !== headerBuf.length) {
      return false
    }

    return crypto.timingSafeEqual(cookieBuf, headerBuf)
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ============================================
  // CORS PROTECTION — Block cross-origin API requests
  // ============================================
  const isApiRoute = pathname.startsWith('/api/')
  const isWebhook = pathname.startsWith('/api/courier/webhook')

  if (isApiRoute && !isWebhook) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // If Origin header is present, it must match our own host
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin requests not allowed' },
        { status: 403 }
      )
    }
  }

  // ============================================
  // CSRF VALIDATION for state-changing API requests
  // ============================================
  const method = request.method
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  if (isStateChanging && isApiRoute && !isCsrfExempt(pathname)) {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        { success: false, error: 'Security validation failed. Please refresh and try again.' },
        { status: 403 }
      )
    }
  }

  // ============================================
  // SECURITY HEADERS
  // ============================================
  const isDev = process.env.NODE_ENV === 'development'

  // For production, create a new response with nonce
  if (!isDev) {
    const nonce = crypto.randomBytes(16).toString('base64')

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    })

    // Core security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // Cross-origin isolation headers (prevents Spectre-style attacks)
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

    // Content Security Policy — nonce-based script policy
    const cspHeader = [
      "default-src 'self'",
      `script-src 'strict-dynamic' 'nonce-${nonce}' 'unsafe-inline' https:`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      // FIX: Only allow HTTPS images (removed http:)
      "img-src 'self' blob: data: https:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdnjs.cloudflare.com data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')

    response.headers.set('Content-Security-Policy', cspHeader)
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

    return response
  }

  // Dev mode
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "img-src 'self' blob: data: https: http:",
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdnjs.cloudflare.com data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

// Configure which routes to apply middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
