# 🔍 Krishi Bitan Shop — Full-Stack Analysis Report

**Repository:** https://github.com/raihanetx/krishi-bitan-shop.git  
**Analysis Date:** 2026-05-03  
**Database:** Neon PostgreSQL (Serverless)  
**Deployment Target:** Vercel / Self-hosted (Caddy + Node.js)

---

## 📋 Executive Summary

**Krishi Bitan Shop** is a full-featured, production-grade e-commerce web application built for a Bangladeshi agricultural/farm products shop. It's a **Next.js 16** app with **React 19**, **PostgreSQL** (via Drizzle ORM), **Zustand** for state management, and **Tailwind CSS v4** for styling. The app includes a customer-facing storefront, a complete admin dashboard, Steadfast Courier integration for BD delivery, Cloudinary image hosting, and comprehensive analytics.

**Verdict:** This is a well-architected, security-conscious e-commerce platform with solid production readiness. The codebase is clean, modular, and follows modern best practices.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 16 (App Router) + React 19             │
│  Tailwind CSS v4 + Radix UI + Framer Motion     │
│  Zustand (state) + React Query (server state)   │
├─────────────────────────────────────────────────┤
│                   BACKEND                        │
│  Next.js API Routes (30+ endpoints)             │
│  JWT Auth (jose) + bcrypt password hashing      │
│  AES-256-GCM encryption for API keys            │
├─────────────────────────────────────────────────┤
│                   DATABASE                       │
│  Neon PostgreSQL (Serverless)                    │
│  Drizzle ORM (type-safe)                        │
│  18 tables + 20+ indexes                        │
├─────────────────────────────────────────────────┤
│               EXTERNAL SERVICES                  │
│  Steadfast Courier (BD delivery)                │
│  Cloudinary (image CDN)                         │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (18 Tables)

### Core E-Commerce Tables
| Table | Purpose | Records Format |
|-------|---------|---------------|
| `settings` | Singleton config (site name, delivery, credentials) | Single row (id=1) |
| `categories` | Product categories (icon/image type) | Text PK |
| `products` | Main product catalog | Serial PK |
| `variants` | Product variants (size, weight, stock) | Serial PK |
| `product_images` | Multiple images per product | Serial PK |
| `product_faqs` | Product Q&A | Serial PK |
| `related_products` | Cross-sell relationships | Serial PK |

### Order Management
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `orders` | Order header | Text PK (ORD-XXXXXX), status, courier fields |
| `order_items` | Line items per order | FK → orders (CASCADE delete) |
| `customers` | Customer profiles (by phone) | Unique phone, totalSpent, totalOrders |
| `coupons` | Discount codes (%, fixed, scoped) | Unique code, scope: all/products/categories |
| `abandoned_checkouts` | Cart abandonment tracking | Session-based, duration tracking |

### Analytics Tables
| Table | Purpose |
|-------|---------|
| `product_views` | Daily product view counts |
| `cart_events` | Add/remove cart tracking |
| `visitor_sessions` | Visitor tracking (device, browser, OS) |
| `session_analytics` | Session duration, bounce rate, conversion |
| `page_views` | Detailed page-level tracking |

### Security Tables (Created at Runtime)
| Table | Purpose |
|-------|---------|
| `audit_logs` | Login/credential change audit trail |
| `login_attempts` | IP-based rate limiting (persistent) |
| `api_rate_limits` | API rate limiting (DB-backed) |

### Key Relationships
```
categories ←── products ←── variants
                    ├── product_images
                    ├── product_faqs
                    ├── related_products
                    └── reviews

customers ←── orders ←── order_items
                    └── (courier tracking fields)

products ←── product_views, cart_events
```

### Indexes (20+)
Strategic indexes on: `products(category_id)`, `products(status)`, `products(offer)`, `orders(status, created_at)` (composite), `orders(phone)`, `variants(product_id)`, `visitor_sessions(date)`, `session_analytics(session_id)`, and more.

---

## 🔐 Security Analysis

### ✅ Strengths (Excellent)

| Feature | Implementation | Rating |
|---------|---------------|--------|
| **Password Hashing** | bcryptjs with salt rounds=12 | 🟢 Strong |
| **Session Management** | JWT (jose library), 7-day expiry, HTTP-only cookies | 🟢 Strong |
| **CSRF Protection** | Middleware-level, cookie+header token comparison with `timingSafeEqual` | 🟢 Strong |
| **Rate Limiting** | Dual-layer: in-memory + DB-backed, IP-based, 5 attempts → 15min lockout | 🟢 Strong |
| **API Key Encryption** | AES-256-GCM, derived from SESSION_SECRET | 🟢 Strong |
| **Bot Detection** | Honeypot fields, timing checks, user-agent analysis | 🟢 Strong |
| **Input Validation** | Zod schemas, sanitizeString, phone/address/price validators | 🟢 Strong |
| **CSP Headers** | Nonce-based script policy in production | 🟢 Strong |
| **CORS** | Origin header validation, blocks cross-origin API requests | 🟢 Strong |
| **Security Headers** | X-Frame-Options: DENY, HSTS, COOP, CORP | 🟢 Strong |
| **Audit Logging** | All auth events logged with IP, user-agent, masked values | 🟢 Strong |
| **Credential Masking** | API responses never expose actual secrets | 🟢 Strong |
| **Webhook Auth** | Bearer token with timing-safe comparison | 🟢 Strong |

### ⚠️ Concerns (Minor)

| Issue | Severity | Details |
|-------|----------|---------|
| **DATABASE_URL in env** | Low | Connection string contains credentials — standard for Neon, but ensure `.env` is never committed (`.gitignore` covers this) |
| **SESSION_SECRET shared** | Medium | SESSION_SECRET is used for both JWT signing AND encryption key derivation. Compromise of one compromises both. Consider separate keys. |
| **Admin password in settings table** | Low | Hashed with bcrypt, but stored in same DB as other data. If DB is compromised, attacker gets hash. Standard practice, but worth noting. |
| **No HTTPS enforcement in Caddyfile** | Low | Caddyfile uses `:81` (HTTP only). For production, add a domain for automatic HTTPS. |
| **`typescript: ignoreBuildErrors: false`** | Info | Good — this was previously `true` (ignoring all TS errors). Now fixed. |

### Security Score: **9/10** — Production-grade security

---

## 🎨 Frontend Analysis

### Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS v4 + `tailwindcss-animate`
- **UI Components:** Radix UI primitives (30+ components)
- **State:** Zustand (persist via localStorage)
- **Server State:** TanStack React Query
- **Animations:** Framer Motion
- **Icons:** Remix Icons + Lucide React
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod resolvers

### Pages/Routes
| Route | Purpose |
|-------|---------|
| `/` | Homepage (Shop, categories, offers, featured) |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/thank-you` | Order confirmation |
| `/offers` | Offers page |
| `/profile` | Customer profile |
| `/history` | Order history (by phone) |
| `/category/[name]` | Category products |
| `/search/[q]` | Search results |
| `/[slug]` | Dynamic content pages |
| `/admin` | Admin dashboard |
| `/admin/setup` | Initial admin setup wizard |

### Admin Dashboard Views
1. **Overview** — Revenue, orders, visitors, conversion metrics
2. **Categories** — CRUD with icon/image support
3. **Products** — Full product management with variants, images, FAQs
4. **Orders** — Order management with Steadfast Courier integration
5. **Coupons** — Discount code management
6. **Abandoned** — Cart abandonment tracking
7. **Customers** — Customer profiles and history
8. **Inventory** — Stock management with low-stock alerts
9. **Reviews** — Review moderation
10. **Settings** — Site configuration (branding, delivery, policies)
11. **Credentials** — API key management (Steadfast, Cloudinary)
12. **Backup** — Database backup/restore

### Key Frontend Features
- **Smart Caching:** Memory + localStorage + server-side cache (30s-60s TTL)
- **Image Optimization:** Next.js Image component, AVIF/WebP formats
- **Skeleton Loading:** Professional loading states
- **Page Transitions:** Framer Motion animations
- **Visitor Tracking:** Persistent visitor ID (localStorage) + session tracking
- **Cart Persistence:** Zustand persist with localStorage
- **Coupon System:** Auto-validation, scope-based (all/products/categories)
- **Spin Wheel:** Gamification feature for offers
- **Bottom Navigation:** Mobile-first navigation
- **Dark Mode:** next-themes support (configured but toggle not prominent)
- **Responsive Design:** Mobile-first with desktop optimization

---

## ⚙️ Backend API Routes (30+)

### Public APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/shop-data` | All products, categories, settings (cached 60s) |
| GET | `/api/product-details` | Single product with variants, images, FAQs, reviews |
| POST | `/api/orders` | Create order (bot detection + rate limiting) |
| GET | `/api/orders?phone=XXX` | Customer order lookup by phone |
| POST | `/api/reviews` | Submit product review |
| POST | `/api/visitors` | Visitor tracking |
| POST | `/api/analytics` | Cart event tracking |
| POST | `/api/abandoned` | Abandoned checkout tracking |
| GET | `/api/health` | Health check |

### Admin APIs (Auth Required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST/PUT/DELETE | `/api/products` | Full CRUD |
| GET/POST/PUT/DELETE | `/api/categories` | Full CRUD |
| GET/PATCH/PUT | `/api/orders` | Order management + status updates |
| GET/POST/DELETE | `/api/coupons` | Coupon management |
| GET | `/api/dashboard` | Analytics dashboard data |
| GET/PUT | `/api/settings` | Site configuration |
| POST | `/api/upload` | Image upload to Cloudinary |
| GET/POST | `/api/courier` | Steadfast Courier operations |
| GET | `/api/backup` | Database backup download |
| POST | `/api/init-db` | Manual DB initialization |

### Auth APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Admin login (JWT cookie) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/session` | Check session status |
| GET/POST | `/api/setup` | Initial admin setup |
| GET | `/api/csrf` | CSRF token endpoint |

### Webhook APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/courier/webhook` | Steadfast status updates (Bearer auth) |

---

## 🚚 Steadfast Courier Integration

- **API:** `https://portal.packzy.com/api/v1`
- **Features:** Create order, check status (by consignment/invoice/tracking), get balance, bulk orders
- **Auto-send:** Orders auto-sent to courier when status → "approved"
- **Webhook:** Receives delivery status updates, auto-updates order status
- **Credentials:** Environment variables only (`STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY`)

---

## ☁️ Cloudinary Integration

- **Purpose:** Image hosting CDN for product images, logos, hero banners
- **Features:** Upload, delete, auto-optimization (quality:auto, format:auto)
- **Folders:** `ecomart/products`, `ecomart/logos`, etc.
- **Credentials:** Environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)

---

## 📊 Analytics & Tracking

### Visitor Tracking
- **Persistent Visitor ID** (localStorage) — survives browser sessions
- **Session ID** (sessionStorage) — per-tab tracking
- **Device Detection:** Mobile/tablet/desktop, browser, OS
- **New vs Returning:** Based on first visit date

### Session Analytics
- Session duration tracking (heartbeat-based)
- Bounce rate (1 page + <10 seconds)
- Cart add/remove events per session
- Conversion tracking (session → order)

### Dashboard Metrics
- Revenue, orders, avg order value
- Unique visitors, new vs returning
- Product views, cart additions
- Top selling products, most viewed
- Device/OS/browser breakdown
- Daily stats with configurable timeframes
- Abandoned cart value
- Conversion rate, revenue per visitor

---

## 🚀 Performance Optimizations

| Optimization | Implementation |
|-------------|---------------|
| **Server-Side Caching** | Global in-memory caches (settings, shop data, dashboard) with TTL |
| **HTTP Caching** | Cache-Control headers, CDN hints, stale-while-revalidate |
| **Query Optimization** | Parallel queries (Promise.all), N+1 prevention |
| **Image Optimization** | Next.js Image, AVIF/WebP, 30-day cache |
| **Code Splitting** | Lazy-loaded admin views, dynamic imports |
| **Bundle Optimization** | optimizePackageImports for lucide, recharts, framer-motion |
| **Connection Pooling** | postgres.js with configurable max connections |
| **Static Asset Caching** | 1-year immutable cache for `_next/static` |
| **Request Deduplication** | In-flight request dedup in smart-cache |
| **Base64 Filtering** | Removes base64 images from API responses |

---

## 🧩 State Management

### Zustand Stores

1. **`useShopStore`** — Products, categories, settings, variants, selected product
   - Persisted: `lastFetch` timestamp only
   - Cache: Memory + localStorage

2. **`useCartStore`** — Cart items, applied coupon, quantity management
   - Persisted: Items + applied coupon (localStorage key: `krishi-bitan-cart`)
   - Features: Auto-coupon validation, cart event tracking

3. **`useOrderStore`** — Order history, checkout state

---

## 📦 Deployment Configuration

### Vercel (Primary)
- Next.js 16 native support
- Edge Runtime optimizations
- Automatic image optimization

### Self-Hosted (Caddy)
- Caddyfile reverse proxy on port 81
- Node.js on port 3000
- X-Forwarded-For/Proto headers

### Environment Variables Required
```
DATABASE_URL=postgresql://...        # Neon PostgreSQL
SESSION_SECRET=...                   # 32+ chars, JWT + encryption
STEADFAST_API_KEY=...               # Courier API
STEADFAST_SECRET_KEY=...            # Courier API
CLOUDINARY_CLOUD_NAME=...           # Image CDN
CLOUDINARY_API_KEY=...              # Image CDN
CLOUDINARY_API_SECRET=...           # Image CDN
```

---

## 🔧 Database Initialization

The app has **automatic database initialization** (`auto-init.ts`):
- Creates all 18 tables if they don't exist
- Adds missing columns via ALTER TABLE migrations
- Creates foreign key constraints
- Creates performance indexes
- Seeds default settings row
- Runs on first DB access (non-blocking background)

Manual commands:
```bash
npx tsx src/scripts/seed.ts          # Seed default settings
npx tsx src/scripts/reset-admin.ts   # Reset admin password
npm run db:push                       # Push schema via Drizzle
```

---

## 📝 Key Findings & Recommendations

### ✅ What's Done Well
1. **Security-first design** — No hardcoded secrets, bcrypt, CSRF, rate limiting, bot detection
2. **Smart caching** — Multi-layer (memory → localStorage → server → CDN)
3. **Database design** — Proper normalization, foreign keys, indexes
4. **Code quality** — TypeScript strict, modular structure, clean separation
5. **Production readiness** — Health checks, backup/restore, error handling
6. **Bangladesh-specific** — Phone validation (01XXXXXXXXX), BDT currency, Dhaka delivery zones
7. **Courier integration** — Full Steadfast API with webhook support
8. **Analytics** — Comprehensive visitor/session/product tracking

### ⚠️ Potential Improvements
1. **Add i18n** — Bengali language support (next-intl is installed but not configured)
2. **Add tests** — No test files found (Jest/Vitest recommended)
3. **Add rate limiting to more endpoints** — Some admin endpoints could use stricter limits
4. **Consider separate encryption key** — Don't derive from SESSION_SECRET
5. **Add database connection retry logic** — For Neon cold starts
6. **Add Sentry/error monitoring** — For production error tracking
7. **Consider Redis** — For rate limiting and caching in multi-instance deployments

---

## 📊 File Count Summary

| Category | Count |
|----------|-------|
| API Routes | 30+ |
| React Components | 60+ |
| UI Components (Radix) | 35+ |
| Database Tables | 18 |
| Database Indexes | 20+ |
| Zustand Stores | 3 |
| Custom Hooks | 6 |
| Lib/Utility Files | 15+ |
| Total Source Files | ~200 |

---

**Report Generated:** 2026-05-03 09:29 GMT+8  
**Analysis Scope:** Complete codebase (frontend, backend, database, security, deployment)
