# 🌾 Krishi Bitan Shop

A full-stack e-commerce web application built for Bangladesh — featuring Cash on Delivery, Steadfast Courier integration, comprehensive admin dashboard, and real-time analytics.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4 |
| **UI Components** | Radix UI + shadcn/ui (50+ components) |
| **State** | Zustand (persist to localStorage) |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | Custom JWT (jose) + bcryptjs |
| **Image CDN** | Cloudinary |
| **Courier** | Steadfast (Packzy API) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |

## 📦 Features

### Customer-Facing
- **Product Catalog** — Categories, product grid with search, offer cards sorted by highest savings
- **Product Details** — Image gallery, variant selection, quantity control, reviews, FAQ, related products
- **Shopping Cart** — Persistent in localStorage, quantity controls, free delivery progress bar
- **Checkout** — Form validation (Bangladesh phone format), coupon system, delivery charge calculation (Dhaka vs outside)
- **Order Tracking** — Order history lookup by phone number with real-time courier status
- **Offers Page** — Active coupons and promotional products
- **Visitor Analytics** — Device, browser, OS tracking with session duration
- **Bengali UI** — All customer-facing text in Bengali with Hind Siliguri font

### Admin Dashboard
- **Overview** — Revenue, orders, visitors, conversion rate, device stats, session analytics
- **Orders** — Full management with status updates, Steadfast Courier auto-send on approval
- **Products** — CRUD with variants, images, FAQs, related products
- **Categories** — Category management with icon/image support
- **Inventory** — Stock level management per variant
- **Coupons** — Scope-based coupons (all, specific products, specific categories)
- **Reviews** — Review moderation
- **Customers** — Customer profiles with order history and spending analytics
- **Abandoned Carts** — Cart abandonment tracking grouped by phone with visit history
- **Settings** — Site branding, delivery charges, content pages, hero animation
- **Credentials** — API key management (Steadfast, Cloudinary)
- **Backup** — Full database backup and restore

### Security
- **Authentication** — JWT sessions with bcrypt password hashing (12 rounds)
- **Rate Limiting** — Dual-layer (in-memory + DB-backed): login (5 attempts/15min lockout), orders (10/min), reviews (5/min)
- **CSRF Protection** — Double-submit cookie pattern with timing-safe comparison
- **Bot Detection** — Honeypot fields, form timing checks, User-Agent analysis
- **API Key Encryption** — AES-256-GCM for stored credentials
- **Input Validation** — Comprehensive validators for phone, email, address, product data
- **CORS** — Origin header validation on all API routes
- **CSP** — Nonce-based Content Security Policy, HSTS, X-Frame-Options: DENY
- **Audit Logging** — Tracks login attempts, credential changes with IP + User-Agent

### Performance
- **Single API Call** — `/api/shop-data` fetches categories + products + settings + variants in one parallel query
- **Multi-Layer Caching** — Global in-memory cache + HTTP Cache headers + CDN hints + Zustand localStorage
- **Image Optimization** — Next.js Image with AVIF/WebP, 30-day cache, responsive sizes
- **Code Splitting** — Admin views lazy-loaded with React.lazy()
- **Connection Pooling** — postgres.js with configurable pool size
- **Parallel Queries** — Dashboard, product details, and order creation use Promise.all()

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/raihanetx/krishi-bitan-shop.git
cd krishi-bitan-shop

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets
```

### Environment Variables

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Session Secret (Required - min 32 characters)
SESSION_SECRET="your-very-long-random-secret-string"

# Steadfast Courier (Optional)
STEADFAST_API_KEY="your-api-key"
STEADFAST_SECRET_KEY="your-secret-key"

# Cloudinary Image CDN (Optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Database Setup

The database tables are created automatically on first run. No manual migration needed.

```bash
# Or manually push the schema
npm run db:push

# Seed sample data (optional)
npm run db:seed
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the shop.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

### First-Time Setup

1. Visit `/admin/setup` to create your admin credentials
2. Login at `/admin` with your credentials
3. Go to **Settings** to configure your shop name, logo, delivery charges
4. Go to **Categories** to create product categories
5. Go to **Products** to add your products with variants and images

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # 28 API route handlers
│   ├── admin/              # Admin dashboard
│   ├── cart/checkout/      # Shopping flow
│   └── [slug]/             # Dynamic product pages
├── components/
│   ├── admin/              # Admin dashboard (12 views)
│   ├── shop/               # Shop, ProductDetail, Cart, Checkout
│   ├── layout/             # Header, Footer, BottomNav
│   └── ui/                 # 50+ shadcn/ui components
├── db/
│   ├── schema.ts           # Drizzle schema (18 tables)
│   └── index.ts            # DB connection + caching
├── hooks/                  # Custom hooks (CSRF, tracking, router)
├── lib/                    # Auth, security, validation, courier
├── store/                  # Zustand stores (shop, cart, order)
└── types/                  # TypeScript interfaces
```

## 🗄️ Database Schema

18 tables across 4 categories:

**Core Business:** categories, products, variants, product_images, product_faqs, related_products, customers, orders, order_items, reviews, coupons

**Analytics:** product_views, cart_events, visitor_sessions, session_analytics, page_views, abandoned_checkouts

**System:** settings (singleton config), audit_logs, login_attempts, api_rate_limits

## 🔌 API Routes

28 endpoints organized by access level:

| Access | Routes |
|--------|--------|
| **Public** | shop-data, products, product-details, categories, orders (POST), reviews, visitors, tracking, abandoned, csrf, health, setup, auth/* |
| **Admin** | products (CRUD), categories (CRUD), orders (GET/PUT/PATCH), customers, coupons, settings, dashboard, inventory, courier, upload, backup, restore, seed, init-db, audit-logs |

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Self-Hosted with Caddy
```bash
npm run build
# Use the included Caddyfile for reverse proxy
```

### Docker
```bash
# Uncomment output: "standalone" in next.config.ts
npm run build
# Build Docker image
```

## 📄 License

MIT

## 🙏 Credits

Built with Next.js, Drizzle ORM, and shadcn/ui
