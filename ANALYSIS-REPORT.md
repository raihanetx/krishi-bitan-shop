# 🌾 Krishi Bitan Shop — Complete Technical Analysis Report

**Date:** May 3, 2026  
**Repository:** https://github.com/raihanetx/krishi-bitan-shop.git  
**Overall Score:** ⭐ **8.2/10** — Well-Built Production E-Commerce Platform

---

## 📋 Executive Summary

**Krishi Bitan Shop** is a full-stack e-commerce web application built with **Next.js 16**, **React 19**, **PostgreSQL (Neon Serverless)**, and **Drizzle ORM**. It's a Bangladesh-focused online shop (agricultural products) with Cash on Delivery payment, Steadfast Courier integration, Cloudinary image uploads, and a comprehensive admin dashboard.

The codebase is **production-grade** with strong security practices, optimized database queries, and thoughtful UX design.

---

## 🏗️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Frontend | React 19 + TypeScript | 19.2.4 |
| Styling | Tailwind CSS 4 + tw-animate-css | 4.x |
| UI Library | Radix UI + shadcn/ui | Latest (50+ components) |
| State Management | Zustand (persist) | 5.0.6 |
| Database | PostgreSQL (Neon Serverless) | @neondatabase/serverless |
| ORM | Drizzle ORM | 0.45.1 |
| Auth | Custom JWT (jose) + bcryptjs | 6.2.1 / 3.0.3 |
| Image CDN | Cloudinary | 2.9.0 |
| Courier | Steadfast (Packzy API) | v1 |
| Charts | Recharts | 2.15.4 |
| Animations | Framer Motion | 12.23.2 |
| Forms | React Hook Form + Zod | 7.60 / 4.0 |
| Data Fetching | TanStack React Query | 5.82 |
| Deployment | Vercel / Caddy / Netlify ready | — |

---

## 🗄️ Database Schema — 18 Tables

### Core Business Tables (11)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `categories` | Product categories | `id` (text PK), `name`, `type`, `icon`, `image`, `status` |
| `products` | Product catalog | `id` (serial), `name`, `category`, `categoryId` (FK), `price`, `discount`, `offer`, `status` |
| `variants` | Product variants (size/weight) | `id`, `name`, `stock`, `initialStock`, `price`, `productId` (FK) |
| `product_images` | Multiple product images | `id`, `url`, `sortOrder`, `productId` (FK) |
| `product_faqs` | Product Q&A | `id`, `question`, `answer`, `productId` (FK) |
| `related_products` | Product relationships | `id`, `relatedProductId`, `productId` (FK) |
| `customers` | Customer records | `id`, `name`, `phone` (unique), `address`, `totalSpent`, `totalOrders` |
| `orders` | Order records | `id` (text PK), `customerName`, `phone`, `status`, `courierStatus`, `total` |
| `order_items` | Line items per order | `id`, `name`, `qty`, `basePrice`, `orderId` (FK, CASCADE delete) |
| `reviews` | Product reviews | `id`, `name`, `rating`, `text`, `productId` (FK) |
| `coupons` | Discount coupons | `id`, `code` (unique), `type`, `value`, `scope`, `expiry` |

### Analytics & Tracking Tables (6)

| Table | Purpose |
|-------|---------|
| `product_views` | Daily product view counts |
| `cart_events` | Add/remove cart tracking |
| `visitor_sessions` | Visitor tracking with device info |
| `session_analytics` | Session duration, bounce rate, conversion |
| `page_views` | Detailed page view tracking |
| `abandoned_checkouts` | Cart abandonment tracking with checkout duration |

### System Tables (4, auto-created)

| Table | Purpose |
|-------|---------|
| `settings` | Singleton site config (id=1), stores ALL site settings including admin credentials |
| `audit_logs` | Security audit trail |
| `login_attempts` | Rate limiting for login (IP-based) |
| `api_rate_limits` | General API rate limiting |

### Key Relationships
- Products → Categories (via `categoryId` FK)
- Variants, Images, FAQs, Related Products → Products (FK)
- Order Items → Orders (FK with CASCADE delete)
- Orders → Customers (via `customerId` FK)
- Reviews → Products + Customers (FK)

### Indexes
- `idx_products_category`, `idx_products_status`, `idx_products_offer`
- `idx_variants_product_id`
- `idx_orders_status`, `idx_orders_created_at`, `idx_orders_phone`, `idx_orders_status_created` (composite)
- `idx_visitor_sessions_date`, `idx_visitor_sessions_session_id`, `idx_visitor_sessions_visitor_id`
- `idx_product_views_date`, `idx_product_views_product_id`, `idx_product_views_product_date` (composite)

---

## 🔌 API Routes — 28 Endpoints

### Public Endpoints
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/shop-data` | GET | ⚡ Main data endpoint — categories, products, settings, variants in ONE call (60s cache) |
| `/api/products` | GET | Product listing with category/search/offer filters |
| `/api/product-details` | GET | All product data (variants, images, FAQs, reviews) in ONE call (2min cache) |
| `/api/categories` | GET | Category listing with product counts |
| `/api/orders` | POST | Create order (bot detection + rate limiting: 10/min) |
| `/api/orders` | GET?phone= | Customer order lookup by phone (rate limited: 30/min) |
| `/api/customers` | POST | Create/update customer during checkout |
| `/api/coupons` | GET?code= | Validate coupon code at checkout |
| `/api/reviews` | GET, POST | Product reviews (rate limited: 5/min) |
| `/api/visitors` | POST | Visitor session tracking |
| `/api/tracking/session` | POST | Session analytics (start/heartbeat/end/pageview/cart) |
| `/api/abandoned` | POST, PATCH | Abandoned cart tracking |
| `/api/analytics` | POST | Product view + cart event tracking |
| `/api/csrf` | GET | CSRF token endpoint |
| `/api/health` | GET | Health check (returns minimal info) |
| `/api/setup` | GET, POST | Initial admin credential setup |
| `/api/auth/login` | POST | Admin login (bot detection + rate limiting) |
| `/api/auth/session` | GET | Check session status |
| `/api/auth/logout` | POST | Logout |
| `/api/courier/webhook` | POST | Steadfast webhook (Bearer token auth) |

### Admin-Only Endpoints (require JWT session)
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/products` | POST, PUT, DELETE, PATCH | Full product CRUD |
| `/api/categories` | POST, PUT, DELETE | Category CRUD |
| `/api/orders` | GET (all), PUT, PATCH | Order management + Steadfast auto-send |
| `/api/customers` | GET, PUT | Customer management |
| `/api/coupons` | GET (all), POST, PUT, DELETE | Coupon CRUD |
| `/api/reviews` | DELETE | Review moderation |
| `/api/settings` | GET (full), PUT | Site configuration |
| `/api/dashboard` | GET | Full analytics dashboard data |
| `/api/inventory` | GET, PUT | Stock management |
| `/api/courier` | GET, POST | Steadfast operations (balance, status, create order) |
| `/api/upload` | POST, DELETE | Cloudinary image management |
| `/api/backup` | GET | Full database backup (JSON) |
| `/api/restore` | POST | Restore from backup file |
| `/api/seed` | POST, DELETE | Demo data management |
| `/api/init-db` | POST | Manual DB initialization |
| `/api/audit-logs` | GET | Security audit logs |

---

## 🛡️ Security Analysis — Score: 9/10

### ✅ Strengths

1. **Authentication**: Custom JWT (jose library) with bcrypt password hashing (12 rounds), 7-day session cookies with `httpOnly` + `secure` + `SameSite=strict`

2. **Rate Limiting**: Dual-layer system (in-memory fast layer + DB-backed persistent layer)
   - Login: 5 attempts → 15-minute lockout
   - Order creation: 10/min per IP
   - Review submission: 5/min per IP
   - Order lookup: 30/min per IP
   - Settings update: 10/min per IP

3. **CSRF Protection**: Double-submit cookie pattern with timing-safe comparison, middleware-level validation on all state-changing POST/PUT/DELETE routes

4. **Bot Detection**: Multi-layer detection:
   - Honeypot invisible fields (`_hpt`, `website`, `url`)
   - Form timing checks (minimum 1.5s for humans)
   - User-Agent pattern analysis (blocks headless browsers, scrapers)
   - Accept-Language/Accept header validation
   - Allows legitimate search engine bots (Google, Bing, etc.)

5. **API Key Encryption**: AES-256-GCM encryption for stored credentials, key derived from SESSION_SECRET via SHA-256

6. **Input Validation**: Comprehensive validators for phone (Bangladesh 01XXXXXXXXX format), email, address, product data, Zod integration, string sanitization with null byte removal

7. **CORS Protection**: Origin header validation on all API routes, blocks cross-origin requests

8. **Content Security Policy**: Nonce-based CSP in production (`script-src 'strict-dynamic' 'nonce-...'`), HSTS (1 year), X-Frame-Options: DENY, Cross-Origin-Opener-Policy: same-origin

9. **Audit Logging**: Tracks login success/failure, credential changes, rate limit events with IP + User-Agent + masked sensitive values

10. **SQL Injection Prevention**: Drizzle ORM with parameterized queries, `inArray()` for dynamic lists (no raw SQL interpolation)

11. **Password Strength**: Enforced minimum 8 chars, uppercase + lowercase + number + special char, rejects top 100 common passwords, checks sequential/repeated/keyboard patterns

### ⚠️ Minor Concerns

1. **Webhook Auth**: Steadfast webhook uses the API key as Bearer token. If the API key rotates, webhook verification breaks. A separate webhook secret would be more robust.

2. **No Multi-Admin**: Single admin model (settings row id=1). No RBAC.

---

## ⚡ Performance Optimizations — Score: 9/10

1. **Parallel Queries**: `shop-data` fetches categories + products + settings + variants in ONE parallel `Promise.all()` call
2. **Multi-Layer Caching**: Global in-memory cache (settingsCache, shopDataCache, dashboardCache, courierCredentials) + HTTP Cache-Control headers + CDN hints
3. **Request Deduplication**: Prevents duplicate API calls within cache window
4. **Image Optimization**: Next.js Image component with AVIF/WebP formats, 30-day cache, responsive sizes, base64 filtering (strips data: URIs from API responses)
5. **Code Splitting**: Admin views lazy-loaded with React.lazy(), route-based splitting via Next.js App Router
6. **Connection Pooling**: postgres.js with configurable pool (10 prod / 3 dev), 30s idle timeout, prepared statements
7. **Static Asset Caching**: 1-year immutable cache for `_next/static`, 30-day for images
8. **Stale-While-Revalidate**: Most endpoints serve stale cache while refreshing in background
9. **Optimized Package Imports**: `lucide-react`, `recharts`, `framer-motion` tree-shaken

---

## 📱 Frontend Architecture

### Pages (Next.js App Router)
| Route | Purpose |
|-------|---------|
| `/` | Main shop — categories, products, hero carousel, offers |
| `/cart` | Shopping cart with quantity management |
| `/checkout` | Order checkout with abandoned cart tracking |
| `/thank-you` | Order confirmation |
| `/offers` | Promotional offers |
| `/profile` | User profile |
| `/history` | Order history lookup by phone |
| `/admin` | Full admin panel (12 views) |
| `/admin/setup` | Initial admin credential setup |
| `/[slug]` | Dynamic content pages (about, terms, refund, privacy) |
| `/category/[name]` | Category-specific product listing |
| `/search/[q]` | Product search results |

### Admin Dashboard (12 Views)
1. **Overview** — Revenue, orders, visitors, conversion, device stats, session analytics
2. **Products** — Full CRUD with image upload, variants, FAQs, related products
3. **Categories** — Category management with icon/image support
4. **Orders** — Order management with status updates, Steadfast auto-send, courier tracking
5. **Customers** — Customer profiles with order history and spending analytics
6. **Inventory** — Stock level management per variant with low/medium thresholds
7. **Coupons** — Coupon creation with scope (all/products/categories), expiry
8. **Reviews** — Review moderation
9. **Abandoned** — Cart abandonment tracking grouped by phone with visit history
10. **Settings** — Site config (branding, delivery, content, hero animation)
11. **Credentials** — API key management (Steadfast, Cloudinary)
12. **Backup** — Database backup/restore

### State Management (Zustand)
- **useShopStore** — Products, categories, settings with multi-layer caching (memory → localStorage → API)
- **useCartStore** — Cart items with localStorage persistence, coupon validation, cart event analytics tracking
- **useOrderStore** — Order history

### Visitor Tracking System
- **Visitor ID** (localStorage, persistent): `V-XXXXXX` — identifies new vs returning across sessions
- **Session ID** (sessionStorage, per-session): `S-XXXXXX` — tracks individual sessions
- **Device/Browser/OS detection** via User-Agent parsing
- **Session heartbeat** every 30 seconds (duration tracking)
- **Bounce detection**: 1 page + under 10 seconds = bounced
- **Conversion tracking**: session → order linkage

---

## 🔗 Third-Party Integrations

### 1. Steadfast Courier (Bangladesh)
- Auto-sends orders to courier on admin approval
- Webhook receiver for real-time delivery status updates
- Balance check, status tracking (by consignment ID, invoice, tracking code)
- Credentials: env vars only (`STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY`)

### 2. Cloudinary (Image CDN)
- Image upload with auto-optimization (quality:auto, format:auto)
- Folder organization (`ecomart/logo`, `ecomart/product`, etc.)
- Delete support via public ID
- Credentials: env vars only (`CLOUDINARY_*`)

### 3. Neon PostgreSQL
- Serverless PostgreSQL with connection pooling
- SSL required, auto-init tables on first access

---

## 🎯 Business Logic Highlights

### Order Flow
1. Customer browses → products loaded via `/api/shop-data` (cached 60s)
2. Adds to cart → tracked via `/api/analytics` (cart-add event)
3. Checkout → abandoned checkout tracked via `/api/abandoned`
4. Places order → `/api/orders` (bot detection + rate limiting + validation)
5. Order created → customer record updated/created in parallel
6. Admin approves → auto-sent to Steadfast Courier
7. Webhook updates → delivery status synced to order

### Discount System
- **Product-level**: Percentage (`pct`) or fixed amount (`fixed`) per product/variant
- **Coupons**: Scope-based (all, specific products, specific categories), expiry support
- **Delivery**: Free delivery above threshold, Dhaka vs outside-Dhaka pricing, universal delivery option

### Backup & Restore
- Full JSON export of all business tables (excludes sensitive credentials)
- Restore with proper dependency ordering (categories → products → variants → ...)
- Credentials never restored from backup (security measure)

---

## 📁 Project Structure

```
krishi-bitan-shop/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # 28 API route handlers
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── cart/checkout/      # Shopping flow
│   │   ├── layout.tsx          # Root layout with dynamic metadata
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── admin/              # Admin dashboard (12 views + sidebar + context)
│   │   ├── auth/               # Login components
│   │   ├── cart/               # Cart + Checkout
│   │   ├── content/            # Static content pages
│   │   ├── layout/             # Header, Footer, BottomNav, HelpCenter
│   │   ├── offers/             # Offers section
│   │   ├── orders/             # Order history
│   │   ├── profile/            # User profile
│   │   ├── shop/               # Shop, ProductCard, ProductDetail, SpinWheel, ThankYou
│   │   └── ui/                 # 50+ shadcn/ui components
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema (18 tables)
│   │   └── index.ts            # DB connection + caching + auto-init
│   ├── hooks/                  # Custom hooks (toast, csrf, tracking, router, mobile)
│   ├── lib/
│   │   ├── auth.ts             # JWT auth + bcrypt + session management
│   │   ├── security.ts         # AES encryption + audit logging + rate limiting
│   │   ├── validation.ts       # Input validators + DB rate limiter
│   │   ├── bot-detection.ts    # Multi-layer bot detection
│   │   ├── csrf.ts             # CSRF token management
│   │   ├── api-auth.ts         # API route auth helpers
│   │   ├── steadfast.ts        # Steadfast Courier service
│   │   ├── password-strength.ts # Password validation
│   │   ├── smart-cache.ts      # Client-side caching utilities
│   │   ├── auto-init.ts        # Database auto-initialization
│   │   ├── api-errors.ts       # Error handling utilities
│   │   ├── visitorTracking.ts  # Visitor tracking utilities
│   │   ├── constants.ts        # App constants
│   │   ├── utils.ts            # General utilities
│   │   └── logger.ts           # Logging utility
│   ├── scripts/                # DB seed + admin reset scripts
│   ├── store/                  # Zustand stores (shop, cart, order)
│   └── types/                  # TypeScript interfaces
├── drizzle/                    # Migration files
├── public/                     # Static assets (logo.svg, placeholder.svg)
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── Caddyfile                   # Caddy reverse proxy config
├── vercel.json                 # Vercel deployment config
└── netlify.toml                # Netlify deployment config
```

---

## ⚠️ Issues & Recommendations

### Warnings
1. **No Transaction Support**: Order creation (order + items + stock decrement) is not wrapped in a DB transaction. If stock decrement fails mid-operation, data inconsistency is possible. **Fix:** Wrap in `db.transaction()`.

2. **Single Admin Model**: Only one admin user supported. No role-based access control (RBAC). **Impact:** Can't have multiple admin levels (super-admin, editor, viewer).

3. **Analytics N+1**: The `/api/analytics` revenue-by-category endpoint does per-item product lookups in a loop instead of using a JOIN or batch query. **Fix:** Use Drizzle's `leftJoin()`.

4. **Date Fields as TEXT**: `order.date`, `order.time`, `reviews.date` use TEXT type instead of TIMESTAMP. Limits date-range query capabilities. **Impact:** Low — works but less efficient for date filtering.

### Info
5. **No i18n**: Despite `next-intl` being a dependency, the app is single-language. Bangladesh market could benefit from Bengali localization.

6. **Missing Composite Index**: `abandoned_checkouts` could benefit from an index on `(session_id, status)` for the PATCH query pattern.

### Strengths to Maintain
- TypeScript strict mode enabled (`ignoreBuildErrors: false`)
- React Strict Mode enabled
- Proper error boundaries (`app/error.tsx`, `app/admin/error.tsx`)
- Auto-initialization on first DB access (zero-config deployment)

---

## 📊 Final Scores

| Category | Score | Notes |
|----------|-------|-------|
| **Security** | 9/10 | Excellent — CSRF, rate limiting, bot detection, encryption, audit logs |
| **Database Design** | 8/10 | Well-normalized, proper FKs, indexes. Minor: TEXT date fields |
| **API Design** | 8/10 | RESTful, parallel queries, caching. Minor: analytics N+1 |
| **Frontend** | 8/10 | Modern React 19, good UX, lazy loading, skeleton states |
| **Performance** | 9/10 | Multi-layer caching, parallel queries, image optimization |
| **Code Quality** | 8/10 | Clean TypeScript, good separation of concerns, well-documented |
| **Business Logic** | 8/10 | Complete e-commerce flow with courier, coupons, analytics |
| **Deployment** | 9/10 | Multi-platform ready (Vercel, Caddy, Netlify, Docker) |
| **OVERALL** | **8.2/10** | **Production-ready e-commerce platform** |

---

*Report generated by AI code analysis — May 3, 2026*
