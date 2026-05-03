# 🔬 Krishi Bitan Shop — Deep Function-Level Analysis

**Every component, every function, every feature — explained.**

---

## 📁 Complete File Map with Line Counts

### Customer-Facing Components (3,857 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `shop/Shop.tsx` | 689 | Main shop page — hero carousel, categories, offer cards, product grid |
| `shop/ProductDetail.tsx` | 775 | Product page — images, variants, reviews, FAQ, related products |
| `shop/ProductCard.tsx` | 146 | Reusable product card component |
| `shop/CategoryProducts.tsx` | 176 | Category-filtered product listing |
| `shop/SpinWheel.tsx` | 169 | Gamification — spin wheel for discounts |
| `shop/ThankYou.tsx` | 315 | Order confirmation page with Bengali UI |
| `cart/Cart.tsx` | 308 | Shopping cart with animations |
| `cart/Checkout.tsx` | 645 | Checkout form with validation, coupon, abandoned tracking |
| `orders/Orders.tsx` | 317 | Order history with courier status mapping |
| `offers/Offers.tsx` | 390 | Offers page with coupon display + Bengali formatting |
| `profile/Profile.tsx` | 257 | Customer profile with delivery location |

### Layout Components (1,430 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `layout/Header.tsx` | 575 | Sticky header — logo, search, cart, menu with categories dropdown |
| `layout/Footer.tsx` | 443 | Footer with contact, links, social media |
| `layout/BottomNav.tsx` | 61 | Mobile bottom navigation bar |
| `layout/HelpCenter.tsx` | 111 | Floating WhatsApp/phone help button |
| `layout/MainLayout.tsx` | 127 | Main layout wrapper |
| `layout/PageLayout.tsx` | 61 | Page layout with transitions |
| `layout/PageTransitionProvider.tsx` | 52 | Page transition animations |

### Auth Components (289 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `auth/AdminLogin.tsx` | 190 | Admin login form with honeypot + bot detection |
| `auth/AuthWrapper.tsx` | 99 | Auth state wrapper for admin pages |

### Admin Dashboard (11,858 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `AdminDashboard.tsx` | 302 | Dashboard shell with lazy-loaded views |
| `AdminSidebar.tsx` | 195 | Sidebar navigation with 12 sections |
| `context/AdminContext.tsx` | 941 | **Brain of admin** — all state, fetch functions, edit helpers |
| `views/OverviewView.tsx` | 625 | Revenue, orders, visitors, conversion charts |
| `views/OrdersView.tsx` | 2,366 | **Largest file** — order management with courier integration |
| `views/ProductsView.tsx` | 1,011 | Product CRUD with variants, images, FAQs |
| `views/CategoriesView.tsx` | 739 | Category management with drag-drop |
| `views/SettingsView.tsx` | 1,445 | Site settings — branding, delivery, content, hero |
| `views/InventoryView.tsx` | 412 | Stock level management |
| `views/CouponsView.tsx` | 369 | Coupon CRUD with scope selection |
| `views/BackupView.tsx` | 476 | Database backup/restore |
| `views/CredentialsView.tsx` | 277 | API key management |
| `views/CustomersView.tsx` | 216 | Customer profiles with order history |
| `views/AbandonedView.tsx` | 226 | Abandoned cart tracking |
| `views/ReviewsView.tsx` | 104 | Review moderation |
| `views/PageContentView.tsx` | 223 | Page content editor |
| `views/VisualCard.tsx` | 48 | Visual card component |
| `components/ChartBar.tsx` | — | Bar chart component |
| `components/MetricCard.tsx` | — | Metric display card |
| `components/StatusBadge.tsx` | — | Order status badge |
| `components/Toast.tsx` | — | Toast notification |
| `components/GettingStarted.tsx` | — | Getting started guide |

### State Management (580 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `store/useShopStore.ts` | 340 | Products, categories, settings with multi-layer cache |
| `store/useCartStore.ts` | 210 | Cart with localStorage persist, coupon validation |
| `store/useOrderStore.ts` | 30 | Order history store |

### Hooks (350 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `hooks/useCsrfFetch.ts` | 85 | CSRF-protected fetch wrapper |
| `hooks/useVisitorTracking.ts` | 140 | Persistent visitor ID + session tracking |
| `hooks/useTracking.ts` | 190 | Session analytics (heartbeat, pageview, cart) |
| `hooks/useAppRouter.ts` | 75 | Centralized navigation helper |
| `hooks/use-mobile.ts` | — | Mobile detection hook |
| `hooks/use-toast.ts` | — | Toast hook |

### Library/Utilities (1,200+ lines)
| File | Lines | Purpose |
|------|-------|---------|
| `lib/auth.ts` | 250 | JWT auth, bcrypt, session management |
| `lib/security.ts` | 300 | AES-256 encryption, audit logging, rate limiting |
| `lib/validation.ts` | 350 | Input validators + DB rate limiter |
| `lib/bot-detection.ts` | 180 | Multi-layer bot detection |
| `lib/csrf.ts` | 120 | CSRF token management |
| `lib/api-auth.ts` | 120 | API route auth helpers |
| `lib/steadfast.ts` | 280 | Steadfast Courier service class |
| `lib/password-strength.ts` | 200 | Password validation with scoring |
| `lib/smart-cache.ts` | 200 | Client-side caching utilities |
| `lib/auto-init.ts` | 200 | Database auto-initialization |
| `lib/animations.ts` | 280 | Framer Motion animation variants |
| `lib/utils.ts` | 15 | cn() + roundPrice() |
| `lib/constants.ts` | 20 | App constants (empty, populated from DB) |
| `lib/logger.ts` | 25 | Dev-only logger |
| `lib/api-errors.ts` | — | Error handling utilities |
| `lib/visitorTracking.ts` | — | Visitor tracking utilities |
| `lib/query-provider.tsx` | — | React Query provider |

---

## 🔄 Complete User Flow — Step by Step

### 1. Customer Lands on Shop (`/`)
```
Shop.tsx mounts
  → useEffect calls fetchData()
  → useShopStore checks: memory cache → localStorage cache → API
  → If stale/empty: GET /api/shop-data (ONE call gets categories + products + settings + variants)
  → Renders: Hero carousel → Categories → Offer Cards → Product Grid
  → useVisitorTracking() hook fires: POST /api/visitors (tracks device, browser, OS)
  → Session heartbeat starts (30s interval): POST /api/tracking/session
```

### 2. Customer Browses Products
```
Product grid renders with Framer Motion stagger animation
  → Each card has hover prefetch: on mouseenter, fetches /api/product-details?id=X (idle callback)
  → Search: debounced (300ms) name-only search with scoring (exact=100, starts=80, contains=40)
  → Category click: navigates to /category/[name] page
```

### 3. Customer Clicks Product (`/[slug]`)
```
ProductDetail.tsx mounts
  → setSelectedProduct(id) fetches /api/product-details?productId=X
  → Gets: product + variants + images + FAQs + related products + reviews (ONE call)
  → Auto-selects variant with highest discount (in TK amount)
  → Tracks product view: POST /api/analytics {type:'view', productId}
  → Shows: image gallery, variant selector, quantity, add to cart, buy now
  → Tabs: Description (expandable), Reviews (submit form), FAQ
  → Related Products section at bottom
```

### 4. Customer Adds to Cart
```
handleAddToCart() fires
  → Step 1: Button shows "যোগ হচ্ছে..." (Adding...) with spinner
  → Step 2: useCartStore.addItem() — adds/increments in localStorage
  → Step 3: POST /api/analytics {type:'cart-add', productId} — tracks event
  → Step 4: After 500ms, button shows "যোগ হয়েছে!" (Added!) with checkmark
  → Step 5: After 800ms more, button resets to normal
  → CartToast shows floating notification
  → If coupon applied: auto-validates if new item matches coupon scope
```

### 5. Customer Views Cart (`/cart`)
```
Cart.tsx renders with Framer Motion animations
  → Shows items with quantity controls (min 1, max 10)
  → Subtotal calculation
  → Free delivery progress bar ("Add TK X more for FREE delivery!")
  → "Shopping" and "Checkout" buttons
  → Items persisted in localStorage (survives refresh)
```

### 6. Customer Goes to Checkout (`/checkout`)
```
Checkout.tsx mounts
  → Gets/creates persistent session ID (localStorage: ecomart_customer_session)
  → Starts checkout duration timer (ref-based, survives StrictMode)
  → Tracks abandoned checkout: POST /api/abandoned {isNewVisit: true}
  → Shows: Order summary → Customer form → Payment (COD) → Confirm button
  
Form validation (real-time):
  → Name: min 2 characters
  → Phone: 11 digits, must start with 01 (Bangladesh format)
  → Address: min 10 characters
  → On blur validation with Bengali error messages

Coupon system:
  → Customer enters code → GET /api/coupons?code=X&cartItems=[...]
  → Validates: exists, not expired, matches scope (all/products/categories)
  → Shows green dot next to applicable items
  → Saves to cart store for persistence

Delivery calculation:
  → If subtotal >= freeDeliveryMin → FREE
  → If universal delivery → fixed charge
  → Otherwise: Dhaka keywords detection → inside/outside Dhaka pricing

Customer info auto-save:
  → As customer types name/phone/address → POST /api/abandoned {isNewVisit: false}
  → Saves info to latest abandoned checkout record
```

### 7. Customer Confirms Order
```
handleConfirm() fires
  → Validates form (Bengali error messages)
  → Checks offline status
  → Button shows spinner "অর্ডার প্রসেস হচ্ছে..."
  → Calls onConfirm() in HomeContent.tsx

HomeContent.handleConfirm():
  → Calculates offer discounts per item (pct or fixed)
  → Calculates delivery charge based on address
  → Creates order number: ORD-{timestamp last 6 digits}
  → POST /api/orders with all data

/api/orders POST handler (NOW IN TRANSACTION):
  → Bot detection (honeypot + timing + user-agent)
  → Rate limiting (10 orders/min per IP)
  → Input validation (name, phone, address, items, totals)
  → TRANSACTION START:
    1. Create/update customer record
    2. Create order record
    3. Create order items
    4. Decrement variant stock (GREATEST guard)
  → TRANSACTION COMMIT
  → Returns success

Frontend:
  → Marks abandoned checkout as completed: PATCH /api/abandoned
  → Clears cart
  → Navigates to /thank-you?order=ORD-XXXXXX
```

### 8. Admin Views Order
```
Admin Dashboard → Orders View
  → GET /api/orders (admin auth required)
  → Shows all orders with filters: all/pending/approved/canceled/courier statuses
  → Click order → expand details (items, customer info, timeline)
  
Admin approves order:
  → PATCH /api/orders {id, status: 'approved'}
  → Auto-sends to Steadfast Courier:
    → POST https://portal.packzy.com/api/v1/create_order
    → Gets consignment_id + tracking_code
    → Updates order with courier info
  → Order status changes to "approved" + courier status "in_review"

Steadfast webhook fires later:
  → POST /api/courier/webhook (Bearer token auth)
  → Updates order courierStatus (delivered, cancelled, etc.)
  → If delivered: records delivery time
  → If cancelled: also cancels order
```

---

## 🧩 Key Functions Explained

### Shop Store (`useShopStore.ts`)
- **`fetchData()`** — Single API call to `/api/shop-data`, caches in memory + localStorage
- **`setSelectedProduct(id)`** — Fetches all product details from `/api/product-details`
- **`addReview()`** — POST to `/api/reviews`, updates local state
- **Multi-layer cache**: memory (instant) → localStorage (survives refresh) → API (60s TTL)

### Cart Store (`useCartStore.ts`)
- **`addItem()`** — Adds/increments item, tracks cart-add event, auto-validates coupon
- **`removeItem()`** — Removes item, tracks cart-remove, checks coupon validity
- **`updateQuantity()`** — Updates qty, removes if 0, tracks event
- **`applyCoupon()`** — Saves coupon to store (persists in localStorage)
- **`checkCouponValidity()`** — Re-validates coupon against current cart items
- **Persisted**: localStorage key `krishi-bitan-cart`

### Admin Context (`AdminContext.tsx`)
The brain of the admin dashboard. On mount, fetches ALL data in parallel:
- `fetchCategories()` — GET /api/categories
- `fetchProducts()` — GET /api/products
- `fetchOrders()` — GET /api/orders
- `fetchCoupons()` — GET /api/coupons
- `fetchCustomers()` — GET /api/customers + /api/orders (parallel, builds profiles)
- `fetchSettings()` — GET /api/settings (with cache-busting)
- `fetchInventory()` — GET /api/inventory
- `fetchReviews()` — GET /api/reviews
- `fetchAbandoned()` — GET /api/abandoned

Helper functions:
- `openCategoryEdit()` — Opens category form (new or edit)
- `openProductEdit()` — Opens product form with variants, FAQs, images, related
- `openCouponEdit()` — Opens coupon form with scope selection

### Header (`Header.tsx`)
- **Desktop**: Logo → Search bar → Cart/Order/Offers/Profile icons → Hamburger menu
- **Mobile**: Logo → Search icon → Cart icon → Hamburger menu
- **Search**: Debounced (300ms), name-only scoring, shows top 5 preview results
- **Menu panel**: Quick links, categories dropdown, legal pages
- **Sticky**: `position: sticky; top: 0; z-index: 200`

### Checkout (`Checkout.tsx`)
- **Session tracking**: Persistent session ID for abandoned cart tracking
- **Duration timer**: Tracks how long customer spends on checkout (ref-based)
- **Form validation**: Real-time with Bengali error messages
- **Coupon validation**: Server-side with scope checking
- **Delivery calculation**: Dhaka keyword detection + settings-based pricing
- **Offline detection**: Shows error if no internet
- **Auto-save**: Customer info saved to abandoned checkout as they type

### Bot Detection (`bot-detection.ts`)
- **Honeypot**: Hidden fields (`_hpt`, `website`, `url`) that bots fill
- **Timing**: Forms submitted in <1.5s are suspicious
- **User-Agent**: Blocks headless browsers, scrapers, automation tools
- **Headers**: Checks Accept-Language, Accept headers
- **Good bots allowed**: Googlebot, Bingbot, etc.

### Steadfast Service (`steadfast.ts`)
- **`createOrder()`** — Sends order to Steadfast API
- **`getStatusByConsignmentId()`** — Check delivery status
- **`getStatusByInvoice()`** — Check by order ID
- **`getStatusByTrackingCode()`** — Check by tracking code
- **`getBalance()`** — Check courier account balance
- **`verifyCredentials()`** — Test if API keys work
- **Credentials**: From env vars only, cached for 30s

---

## 🎨 UI/UX Features

### Animations (Framer Motion)
- **Product cards**: Stagger animation on load, hover lift, tap scale
- **Cart items**: Slide in/out, quantity counter bounce
- **Add to cart**: 3-step animation (adding → added → reset)
- **Hero carousel**: Fade/slide transitions with auto-play
- **Modals**: Backdrop blur, spring-based open/close
- **Page transitions**: Fade in/out between views

### Bengali Support
- All customer-facing text in Bengali (কার্টে যোগ করুন, অর্ডার কনফার্ম করুন, etc.)
- Bengali digit conversion for prices (৳১২০)
- Bengali font support (Hind Siliguri, Noto Sans Bengali)
- Bengali error messages in checkout validation

### Responsive Design
- Mobile-first with Tailwind breakpoints (sm, md, lg, xl)
- Mobile bottom navigation bar
- Mobile search overlay
- Mobile hamburger menu (slide from right)
- Desktop inline search + navigation icons

### Image Handling
- `ImageWithSkeleton` — Loading skeleton while images load
- `ImageWithFallback` — Shows placeholder on error
- `optimized-image` — Next.js Image with optimization
- Error handler: `onError` → `/placeholder.svg`
- Base64 filtering: Strips data: URIs from API responses

---

## 🔐 Security Functions

### Authentication Flow
```
1. Admin visits /admin
2. AuthWrapper checks: GET /api/auth/session
3. If not authenticated → shows AdminLogin
4. AdminLogin: username + password form
   → Honeypot field (invisible to humans)
   → Timing check (form load time)
   → POST /api/auth/login
5. Server: authenticateAdmin()
   → checkRateLimitDB() — 5 attempts, 15min lockout
   → getAdminCredentials() — from settings table
   → verifyPassword() — bcrypt compare
   → createSession() — JWT with 7-day expiry
   → Sets httpOnly cookie: admin_session
6. AuthWrapper: session valid → shows AdminDashboard
```

### CSRF Protection Flow
```
1. Client loads page → GET /api/csrf → gets token
2. Token stored in cookie (csrf_token) + returned to client
3. Client makes POST/PUT/DELETE → includes X-CSRF-Token header
4. Middleware validates: cookie token === header token (timing-safe comparison)
5. Exempt routes: login, logout, session, webhook, setup, orders, reviews, tracking
```

### Rate Limiting
- **Login**: 5 attempts per IP, 15-minute lockout (DB-backed)
- **Orders**: 10 per IP per minute (DB-backed)
- **Reviews**: 5 per IP per minute (DB-backed)
- **Order lookup**: 30 per IP per minute (DB-backed)
- **Settings**: 10 per IP per minute (DB-backed)
- **Webhook**: 60 per IP per minute (in-memory)

---

## 📊 Analytics Tracking

### What Gets Tracked
1. **Product views**: `/api/analytics POST {type:'view', productId}` → `product_views` table
2. **Cart events**: `/api/analytics POST {type:'cart-add'|'cart-remove', productId}` → `cart_events` table
3. **Visitor sessions**: `/api/visitors POST` → `visitor_sessions` table (device, browser, OS)
4. **Session analytics**: `/api/tracking/session POST` → `session_analytics` table
   - Start: creates session record
   - Heartbeat: every 30s, updates duration
   - End: marks session ended, calculates bounce
   - Pageview: increments page_views counter
   - Cart: increments cart_adds/cart_removes
5. **Page views**: `/api/tracking/session POST {action:'pageview'}` → `page_views` table
6. **Abandoned checkouts**: `/api/abandoned POST/PATCH` → `abandoned_checkouts` table

### Dashboard Metrics (from `/api/dashboard`)
- Total revenue, orders, pending, canceled
- Abandoned cart value
- Total visits, unique visitors, new vs returning
- Total customers, repeat customers
- Product views, cart adds
- Average order value, conversion rate, revenue per visitor
- Daily stats (sales, revenue, visitors, product views)
- Device stats (mobile/desktop/tablet, iOS/Android, browsers)
- Session analytics (avg duration, bounce rate)
- Top selling products, most viewed products, top customers
- Cart actions per product

---

## 🗄️ Database Functions

### Auto-Initialization (`auto-init.ts`)
On first database access:
1. Checks if `settings` table exists
2. If not: creates ALL 18 tables with raw SQL
3. Creates all performance indexes
4. Inserts default settings row
5. Sets global flag to skip on subsequent calls

### Caching Strategy
- **Global caches** (persist across requests in same process):
  - `__settingsCache` — Settings data (10s TTL)
  - `__shopDataCache` — Shop data (60s TTL)
  - `__dashboardCache` — Dashboard data (30s TTL)
  - `__courierCredentials` — Courier creds (5min TTL)
- **HTTP cache headers**: `Cache-Control`, `CDN-Cache-Control`, `stale-while-revalidate`
- **Client cache**: Zustand persist (localStorage), memory cache

### Backup & Restore
- **Backup**: Exports all business tables as JSON (excludes credentials)
- **Restore**: Deletes existing data → inserts in dependency order → updates settings
- **Security**: Credentials never restored from backup

---

*Every function, every flow, every security measure — documented.*
