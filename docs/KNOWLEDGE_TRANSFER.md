# Knowledge Transfer Document - Custom CRM

**Version:** 1.0.4
**Last Updated:** January 2026
**Purpose:** Enable independent debugging, maintenance, and feature development

---

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Architecture Overview](#architecture-overview)
3. [Key Technologies](#key-technologies)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Reference](#api-reference)
7. [Payment Processing](#payment-processing)
8. [Campaign System](#campaign-system)
9. [Development Workflow](#development-workflow)
10. [Common Debugging Tasks](#common-debugging-tasks)
11. [Feature Development Guide](#feature-development-guide)
12. [Troubleshooting](#troubleshooting)

---

## Quick Start Guide

### Prerequisites
- Node.js 20+
- Supabase account
- Spreedly account (optional, can use DEMO_MODE)

### Environment Setup

1. **Clone and Install**
   ```bash
   cd "/Applications/Stealth Labz/custom-crm"
   npm install
   ```

2. **Configure Environment Variables**
   Create `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Spreedly (optional if using DEMO_MODE)
   SPREEDLY_ENVIRONMENT_KEY=your-environment-key
   SPREEDLY_ACCESS_SECRET=your-access-secret
   SPREEDLY_SIGNING_SECRET=your-signing-secret

   # Demo Mode (simulates payments without Spreedly)
   DEMO_MODE=true
   ```

3. **Run Migrations**
   ```bash
   # Apply all migrations in supabase/migrations/ to your database
   # Use Supabase CLI or dashboard to run migrations
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

### File Locations Cheat Sheet

| What | Where |
|------|-------|
| **Pages** | `src/app/(dashboard)/` or `src/app/(auth)/` |
| **API Routes** | `src/app/api/` |
| **Components** | `src/components/` |
| **Database Queries** | `src/lib/queries/` or inline in pages |
| **Auth Logic** | `src/lib/auth/` |
| **Payment Logic** | `src/lib/spreedly/` |
| **Types** | `src/types/` |
| **Database Schema** | `supabase/migrations/` |
| **Middleware** | `src/middleware.ts` |

---

## Architecture Overview

### Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  Frontend: Next.js 16 (App Router) + React 19      │
│  - Server Components (dashboard pages)              │
│  - Client Components (checkout flow)                │
│  - TypeScript + Tailwind CSS + Shadcn UI           │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│  Backend: Next.js API Routes                        │
│  - Authentication (Supabase Auth)                   │
│  - REST API (API key auth)                          │
│  - Direct database queries (Server Components)      │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│  Database: Supabase (PostgreSQL)                    │
│  - Multi-tenant with organization_id                │
│  - Row-level security (RLS)                         │
│  - 50+ tables                                       │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│  Payments: Spreedly                                 │
│  - Gateway orchestration                            │
│  - PCI compliance                                   │
│  - Card tokenization                                │
└─────────────────────────────────────────────────────┘
```

### Route Structure

**Route Groups:**
- `(auth)` - Login, register, organization selection
- `(dashboard)` - Protected dashboard routes (customers, products, campaigns, orders, etc.)
- `(public)` - Public checkout flow
- `api/` - API routes (authenticated & public)

### Data Flow Patterns

**1. Dashboard Pages (Server Components)**
```typescript
// src/app/(dashboard)/customers/page.tsx
export default async function CustomersPage() {
  const { organizationId } = await getOrganizationContext()
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', organizationId)

  return <CustomersTable customers={customers} />
}
```

**2. API Routes (with API Key Auth)**
```typescript
// src/app/api/v1/customers/route.ts
export const POST = withApiAuth(async (request, { organizationId }) => {
  const body = await request.json()
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('customers')
    .insert({ ...body, organization_id: organizationId })
    .select()

  return NextResponse.json(data)
})
```

**3. Checkout Flow (Client Components)**
```typescript
// src/components/checkout/checkout-form.tsx
const CheckoutForm = () => {
  const [step, setStep] = useState(1)

  const handleLead = async () => {
    const res = await fetch('/api/checkout/lead', {
      method: 'POST',
      body: JSON.stringify({ email, campaign_id, offer_id })
    })
    setStep(2)
  }

  return <MultiStepWizard />
}
```

---

## Key Technologies

### Core Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Headless component primitives
- **Shadcn UI** - Pre-built components (New York style)
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **next-themes** - Dark mode

### Forms & Validation
- **React Hook Form 7.69.0** - Form state management
- **Zod 4.2.1** - Schema validation
- **@hookform/resolvers** - Form validation bridge

### State Management
- **TanStack React Query 5.90.14** - Server state, caching, mutations

### Database & Auth
- **Supabase 2.89.0** - PostgreSQL database & authentication
- **@supabase/ssr** - Server-side rendering support

### Utilities
- **date-fns 4.1.0** - Date manipulation
- **clsx** - Class name utilities
- **class-variance-authority** - Component variants

---

## Database Schema

### Core Tables Overview

#### Multi-Tenancy
```sql
-- Organizations (tenants)
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT, -- 'starter', 'professional', 'enterprise', 'custom'
  logo_url TEXT,
  primary_color TEXT,
  max_users INTEGER,
  max_api_calls_per_month INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- User profiles (extends auth.users)
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  current_organization_id UUID REFERENCES organizations,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Organization members (many-to-many)
organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  user_id UUID REFERENCES user_profiles,
  role TEXT, -- 'owner', 'admin', 'member'
  status TEXT, -- 'active', 'invited', 'suspended'
  joined_at TIMESTAMP
)

-- API keys
api_settings (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  api_key TEXT UNIQUE,
  secret_key TEXT,
  is_active BOOLEAN,
  allowed_origins TEXT[],
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  last_used_at TIMESTAMP
)
```

#### Customer Management
```sql
-- Customers
customers (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  display_id INTEGER UNIQUE, -- Numeric ID for external APIs
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT, -- 'prospect', 'lead', 'partial', 'customer', 'declined', 'cancelled', 'refunded'

  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,

  -- Campaign context
  campaign_id UUID,
  offer_id UUID,

  -- Aggregates
  total_orders INTEGER DEFAULT 0,
  lifetime_value DECIMAL DEFAULT 0,

  -- Metadata
  custom_fields JSONB,
  notes TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  UNIQUE(email, organization_id)
)

-- Customer addresses
customer_addresses (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers,
  type TEXT, -- 'billing' or 'shipping'
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  is_default BOOLEAN
)

-- Payment methods (tokenized via Spreedly)
customer_payment_methods (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers,
  spreedly_token TEXT,
  card_type TEXT,
  last_four TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN
)
```

#### Products & Campaigns
```sql
-- Products
products (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  display_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  billing_type TEXT, -- 'one_time', 'recurring'

  -- Pricing
  price DECIMAL NOT NULL,
  trial_period_days INTEGER,
  trial_price DECIMAL,
  recurring_price DECIMAL,
  recurring_interval TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  setup_fee DECIMAL,

  -- Shipping
  shipping_cost DECIMAL,
  is_shippable BOOLEAN DEFAULT true,
  weight DECIMAL,
  dimensions JSONB,

  status TEXT, -- 'active', 'inactive', 'archived'
  metadata JSONB,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Campaigns
campaigns (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  display_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  type TEXT, -- 'phone', 'web', 'retail', 'wholesale'
  status TEXT, -- 'active', 'paused', 'archived'

  -- Settings
  checkout_url TEXT,
  confirmation_url TEXT,
  decline_url TEXT,
  gateway_id UUID REFERENCES gateways,

  -- Features
  require_email BOOLEAN DEFAULT true,
  require_phone BOOLEAN,
  require_shipping BOOLEAN DEFAULT true,
  require_billing BOOLEAN DEFAULT true,

  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Campaign offers
campaign_offers (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns,
  name TEXT NOT NULL,
  type TEXT, -- 'standard', 'trial', 'continuity', 'upsell', 'downsell'
  product_id UUID REFERENCES products,

  -- Pricing overrides
  price DECIMAL,
  trial_period_days INTEGER,
  trial_price DECIMAL,
  recurring_price DECIMAL,

  -- Flow control
  parent_offer_id UUID, -- For upsell/downsell chains
  success_url TEXT,
  decline_url TEXT,

  is_active BOOLEAN DEFAULT true,
  metadata JSONB
)

-- Campaign analytics
campaign_analytics (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns,
  date DATE NOT NULL,

  -- Metrics
  views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  refunds DECIMAL DEFAULT 0,

  UNIQUE(campaign_id, date)
)
```

#### Orders & Transactions
```sql
-- Orders
orders (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  display_id INTEGER UNIQUE,
  customer_id UUID REFERENCES customers,
  campaign_id UUID REFERENCES campaigns,
  offer_id UUID REFERENCES campaign_offers,

  -- Amounts
  subtotal DECIMAL NOT NULL,
  shipping_amount DECIMAL DEFAULT 0,
  tax_amount DECIMAL DEFAULT 0,
  discount_amount DECIMAL DEFAULT 0,
  total_amount DECIMAL NOT NULL,

  -- Status
  order_status TEXT, -- 'pending', 'processing', 'completed', 'cancelled', 'refunded'
  payment_status TEXT, -- 'unpaid', 'paid', 'authorized', 'partially_refunded', 'refunded'
  fulfillment_status TEXT, -- 'unfulfilled', 'fulfilled', 'partially_fulfilled'

  -- Metadata
  billing_address JSONB,
  shipping_address JSONB,
  custom_fields JSONB,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Order items
order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders,
  product_id UUID REFERENCES products,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  metadata JSONB
)

-- Transactions
transactions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  order_id UUID REFERENCES orders,
  customer_id UUID REFERENCES customers,
  gateway_id UUID REFERENCES gateways,

  -- Transaction details
  transaction_type TEXT, -- 'purchase', 'authorize', 'capture', 'refund', 'void'
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Gateway response
  gateway_transaction_id TEXT,
  status TEXT, -- 'succeeded', 'failed', 'pending'
  response_code TEXT,
  response_message TEXT,
  avs_result TEXT,
  cvv_result TEXT,

  -- Payment method
  payment_method_token TEXT,
  card_last_four TEXT,
  card_type TEXT,

  metadata JSONB,
  created_at TIMESTAMP
)
```

#### Payment Gateways
```sql
-- Gateways
gateways (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  name TEXT NOT NULL,
  gateway_type TEXT, -- 'stripe', 'authorize_net', 'nmi', 'braintree', etc.
  spreedly_gateway_token TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_test_mode BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,

  -- Credentials (stored in Spreedly)
  credentials JSONB,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Important Indexes

```sql
-- Customer lookups
CREATE INDEX idx_customers_organization_email ON customers(organization_id, email);
CREATE INDEX idx_customers_display_id ON customers(display_id);
CREATE INDEX idx_customers_status ON customers(organization_id, status);

-- Order lookups
CREATE INDEX idx_orders_organization ON orders(organization_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_display_id ON orders(display_id);

-- Transaction lookups
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_gateway ON transactions(gateway_transaction_id);

-- Campaign analytics
CREATE INDEX idx_campaign_analytics_date ON campaign_analytics(campaign_id, date DESC);
```

### Row-Level Security (RLS)

All tables have RLS policies that filter by `organization_id`:

```sql
-- Example policy
CREATE POLICY "Users can only access their organization's data"
ON customers
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);
```

---

## Authentication & Authorization

### Authentication Flow

1. **User Registration** (`/register`)
   - Creates `auth.users` record (Supabase Auth)
   - Creates `user_profiles` record
   - Creates first `organizations` record
   - Creates `organization_members` record with `owner` role

2. **User Login** (`/login`)
   - Supabase Auth validates credentials
   - Session cookie created
   - Middleware checks `current_organization_id`
   - Redirects to `/select-organization` if not set or invalid

3. **Organization Selection** (`/select-organization`)
   - User selects from their organizations
   - Updates `user_profiles.current_organization_id`
   - Redirects to `/dashboard`

4. **Session Management**
   - Middleware refreshes session on every request
   - Cookie-based session storage
   - Auto-redirect to login if expired

### Middleware Protection

File: `src/middleware.ts`

```typescript
// Route protection rules
const publicRoutes = ['/checkout', '/api/checkout', '/api/v1']
const authRoutes = ['/login', '/register', '/select-organization']
const protectedRoutes = ['*'] // Everything else

// Execution flow:
// 1. Refresh Supabase session
// 2. Check if user is authenticated
// 3. Verify organization context
// 4. Apply route protection
// 5. Auto-redirect as needed
```

### Authorization Helpers

File: `src/lib/auth/organization-context.ts`

**Main Function:**
```typescript
// Use in Server Components/API routes
const context = await getOrganizationContext()

// Returns:
{
  user: User,
  profile: UserProfile,
  organization: Organization,
  membership: OrganizationMember,
  role: 'owner' | 'admin' | 'member',
  permissions: { ... },
  organizationId: string
}
```

**Permission Checks:**
```typescript
// Check admin access
if (hasAdminAccess(context)) {
  // Allow action
}

// Require admin
await requireAdmin(context) // Throws if not admin

// Require owner
await requireOwner(context) // Throws if not owner
```

**Organization Switching:**
```typescript
// List user's organizations
const orgs = await getUserOrganizations(userId)

// Switch organization
await switchOrganization(userId, newOrgId)
// Updates current_organization_id and redirects
```

### API Authentication

File: `src/lib/api-auth.ts`

**API Key Format:**
- Header: `Authorization: Bearer sk_live_xxx` or `X-Api-Key: sk_live_xxx`
- Stored in `api_settings` table
- Scoped to single organization

**Using API Auth:**
```typescript
// Wrap API route handler
export const POST = withApiAuth(async (request, context) => {
  const { organizationId } = context

  // Auto-authenticated, auto-logged
  // Rate limiting checked
  // CORS validated

  return NextResponse.json({ ... })
})
```

**API Key Management:**
- Generate: `/settings/api` page
- Rotate: Delete old, create new
- Monitor: Check `api_request_log` table

### Role-Based Permissions

| Role | Permissions |
|------|-------------|
| **owner** | Full access, manage members, delete org, billing |
| **admin** | Manage all resources, view settings, invite members |
| **member** | View and edit assigned resources |

---

## API Reference

### Public API (API Key Required)

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <api_key>` or `X-Api-Key: <api_key>`

#### Customers API

**Create/Update Customer (Upsert)**
```http
POST /api/v1/customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "campaign_id": 1,  // Numeric display_id
  "product_id": 5,   // Numeric display_id
  "utm_source": "google",
  "utm_campaign": "summer_sale",
  "custom_fields": {
    "interest": "fitness",
    "age_range": "25-34"
  }
}

Response 201:
{
  "id": "uuid-here",
  "display_id": 1234,
  "email": "customer@example.com",
  ...
}
```

**List Customers**
```http
GET /api/v1/customers?status=customer&page=1&limit=50

Response 200:
{
  "customers": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "total_pages": 5
  }
}
```

**Get Customer**
```http
GET /api/v1/customers/1234  // Use display_id

Response 200:
{
  "id": "uuid",
  "display_id": 1234,
  "email": "...",
  ...
}
```

**Update Customer**
```http
PUT /api/v1/customers/1234
Content-Type: application/json

{
  "first_name": "Jane",
  "status": "customer"
}
```

**Delete Customer**
```http
DELETE /api/v1/customers/1234
```

#### Orders API

**Create Order**
```http
POST /api/v1/orders
Content-Type: application/json

{
  "customer_id": 1234,
  "campaign_id": 5,
  "offer_id": 10,
  "items": [
    {
      "product_id": 20,
      "quantity": 2,
      "unit_price": 29.99
    }
  ],
  "billing_address": { ... },
  "shipping_address": { ... }
}
```

**List Orders**
```http
GET /api/v1/orders?customer_id=1234&page=1&limit=50
```

**Get Order**
```http
GET /api/v1/orders/5678
```

### Checkout API (Public, No Auth)

**Base URL:** `/api/checkout`

**Validate Campaign**
```http
GET /api/checkout/validate?c=1&o=2

Response 200:
{
  "campaign": { ... },
  "offer": { ... },
  "product": { ... },
  "pricing": {
    "price": 49.99,
    "trial_price": 0,
    "shipping": 5.99,
    "total": 55.98
  }
}
```

**Create Lead**
```http
POST /api/checkout/lead
Content-Type: application/json

{
  "email": "lead@example.com",
  "campaign_id": "uuid",
  "offer_id": "uuid",
  "utm_source": "facebook",
  "ip_address": "1.2.3.4",
  "session_id": "sess_abc123"
}

Response 200:
{
  "customer_id": "uuid",
  "status": "lead"
}
```

**Update Address**
```http
POST /api/checkout/address
Content-Type: application/json

{
  "customer_id": "uuid",
  "billing_address": {
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "shipping_address": { ... }
}

Response 200:
{
  "status": "partial"
}
```

**Process Payment**
```http
POST /api/checkout/payment
Content-Type: application/json

{
  "customer_id": "uuid",
  "campaign_id": "uuid",
  "offer_id": "uuid",
  "payment_method_token": "spreedly_token",
  "custom_fields": {
    "gift_message": "Happy Birthday!"
  }
}

Response 200 (Success):
{
  "success": true,
  "order_id": "uuid",
  "order_display_id": 9876,
  "transaction_id": "uuid"
}

Response 200 (Declined):
{
  "success": false,
  "reason": "insufficient_funds",
  "retry_allowed": true
}
```

**Retry Payment**
```http
POST /api/checkout/retry
Content-Type: application/json

{
  "order_id": "uuid",
  "payment_method_token": "new_spreedly_token"
}
```

---

## Payment Processing

### Spreedly Integration

**Client:** `src/lib/spreedly/client.ts`

#### Key Functions

**Gateway Management**
```typescript
// Create gateway
await spreedlyClient.createGateway('stripe', {
  login: 'sk_test_...',
  // ... gateway-specific credentials
})

// List gateways
const gateways = await spreedlyClient.listGateways()

// Get gateway
const gateway = await spreedlyClient.getGateway(gatewayToken)
```

**Payment Processing**
```typescript
// Purchase (immediate charge)
const result = await spreedlyClient.purchase(gatewayToken, paymentMethodToken, {
  amount: 4999, // cents
  currency: 'USD',
  order_id: 'order_123'
})

// Authorize (hold funds)
const result = await spreedlyClient.authorize(gatewayToken, paymentMethodToken, {
  amount: 4999
})

// Capture (capture authorized funds)
await spreedlyClient.capture(transactionToken, {
  amount: 4999
})

// Refund
await spreedlyClient.refund(transactionToken, {
  amount: 2000 // partial refund
})

// Void
await spreedlyClient.void(transactionToken)
```

**Response Format**
```typescript
{
  succeeded: boolean,
  transaction_token: string,
  gateway_transaction_id: string,
  response_code: string,
  response_message: string,
  avs_result: {
    code: string,
    message: string
  },
  cvv_result: {
    code: string,
    message: string
  }
}
```

### Demo Mode

Set `DEMO_MODE=true` in `.env.local` to simulate payments without Spreedly.

**Behavior:**
- Card ending in `1111` → Success
- Card ending in `0002` or `9999` → Decline
- No real API calls made
- Still creates orders and transactions in database

**Use Cases:**
- Local development without Spreedly account
- Testing checkout flow
- Demo presentations

### Payment Flow in Checkout

1. **Customer enters card** → Spreedly iFrame (client-side)
2. **Spreedly returns token** → `payment_method_token`
3. **Frontend posts to `/api/checkout/payment`** with token
4. **API validates campaign/offer** → Calculates pricing
5. **API fetches gateway** → Organization's configured gateway
6. **Demo mode check:**
   - If `DEMO_MODE=true`: Simulate based on card number
   - If false: Call Spreedly API
7. **Create order** → Insert into `orders` table
8. **Create transaction** → Log in `transactions` table
9. **Update customer** → Status to `customer`
10. **Update analytics** → Increment campaign metrics
11. **Return response** → Frontend redirects accordingly

### Handling Declined Payments

```typescript
// In checkout component
const handlePayment = async (token) => {
  const res = await fetch('/api/checkout/payment', {
    method: 'POST',
    body: JSON.stringify({ payment_method_token: token, ... })
  })

  const data = await res.json()

  if (data.success) {
    router.push(`/checkout/thank-you?order=${data.order_display_id}`)
  } else {
    // Show decline reason
    setError(data.reason)

    if (data.retry_allowed) {
      // Offer to retry with different card
      setStep('retry')
    } else {
      router.push('/checkout/declined')
    }
  }
}
```

### Supported Gateways

- Test Gateway (for development)
- Stripe
- Authorize.net
- NMI (Network Merchants)
- Braintree
- CyberSource
- Adyen
- Worldpay
- PayPal
- Checkout.com

---

## Campaign System

### Campaign Structure

```
Campaign
├── General Details (name, type, status)
├── Offers (multiple)
│   ├── Standard Offer
│   ├── Trial Offer
│   ├── Continuity Offer
│   ├── Upsell Offers
│   └── Downsell Offers
├── Products (bound to campaign)
├── Shipping Options
├── Coupons
├── Custom Fields
└── Analytics
```

### Campaign Types

- **Web** - Online checkout flow (most common)
- **Phone** - Call center orders
- **Retail** - In-person sales
- **Wholesale** - B2B orders

### Offer Types

**Standard Offer**
- One-time purchase
- Simple product sale
- No trial or recurring billing

**Trial Offer**
- Introductory period (7 days, 14 days, etc.)
- Discounted or free trial
- Converts to recurring after trial

**Continuity Offer**
- Subscription/recurring billing
- Monthly, yearly, etc.
- Can have trial period

**Upsell Offer**
- Shown after successful purchase
- Related products or upgrades
- Can chain multiple upsells

**Downsell Offer**
- Shown after declined upsell
- Lower-priced alternative
- Last chance to capture sale

### Campaign Builder

File: `src/app/(dashboard)/campaigns/[id]/edit/page.tsx`

**Tabs:**
1. **General** - Basic info, URLs, gateway selection
2. **Offers** - Create/edit offers with pricing
3. **Products** - Bind products to campaign
4. **Shipping** - Configure shipping options
5. **Coupons** - Discount codes
6. **Tax** - Sales tax configuration
7. **Surcharge** - Additional fees
8. **Email** - Order confirmation emails
9. **SMS** - SMS notifications
10. **Scripts** - Custom tracking pixels
11. **Call Centers** - Phone order routing

### Creating a Campaign

1. Navigate to `/campaigns`
2. Click "New Campaign"
3. Fill out general details:
   - Name
   - Type (web, phone, etc.)
   - Checkout URL
   - Select payment gateway
4. Create offers:
   - Add standard offer first
   - Configure pricing
   - Add trial if needed
   - Add upsell/downsell flow
5. Bind products to offers
6. Configure shipping options
7. Add coupons (optional)
8. Set up email notifications
9. Save and activate

### Using Campaigns in Checkout

**URL Format:**
```
https://yourdomain.com/checkout?c=<campaign_id>&o=<offer_id>
```

**Validation:**
- Campaign must be active
- Offer must be active and belong to campaign
- Product must be bound to campaign
- Gateway must be configured

### Campaign Analytics

**Daily Metrics:**
- Views (checkout page visits)
- Leads (email captured)
- Orders (successful purchases)
- Revenue (total sales)
- Refunds (refunded amount)

**Tracked Automatically:**
- `campaign_analytics` table updated on every action
- Aggregated by date
- Viewable in dashboard

**Accessing Analytics:**
```typescript
const supabase = await createClient()
const { data: analytics } = await supabase
  .from('campaign_analytics')
  .select('*')
  .eq('campaign_id', campaignId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false })
```

---

## Development Workflow

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create project at supabase.com
   - Run migrations from `supabase/migrations/`
   - Copy connection details to `.env.local`

3. **Configure Spreedly (optional)**
   - Sign up at spreedly.com
   - Get environment key and access secret
   - Or use `DEMO_MODE=true`

4. **Start dev server**
   ```bash
   npm run dev
   ```

5. **Create first organization**
   - Register at `/register`
   - Creates organization automatically
   - Generates API keys at `/settings/api`

### Adding a New Feature

**Example: Add "Customer Tags" feature**

1. **Plan the feature** (if complex)
   - What pages need to change?
   - New API routes needed?
   - Database changes required?

2. **Update database schema**
   ```bash
   # Create new migration
   touch supabase/migrations/012_customer_tags.sql
   ```

   ```sql
   -- In migration file
   CREATE TABLE customer_tags (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id UUID REFERENCES organizations NOT NULL,
     customer_id UUID REFERENCES customers NOT NULL,
     tag TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(customer_id, tag)
   );

   CREATE INDEX idx_customer_tags_customer ON customer_tags(customer_id);

   -- RLS policy
   ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can access their org's tags"
   ON customer_tags FOR ALL
   USING (organization_id IN (
     SELECT organization_id FROM organization_members
     WHERE user_id = auth.uid() AND status = 'active'
   ));
   ```

3. **Run migration**
   ```bash
   # Apply to Supabase
   ```

4. **Create TypeScript types**
   ```typescript
   // src/types/customer-tags.ts
   export interface CustomerTag {
     id: string
     organization_id: string
     customer_id: string
     tag: string
     created_at: string
   }
   ```

5. **Create API route (if needed)**
   ```typescript
   // src/app/api/v1/customers/[id]/tags/route.ts
   export const POST = withApiAuth(async (request, { organizationId }) => {
     const customerId = request.nextUrl.pathname.split('/')[4]
     const { tag } = await request.json()

     const supabase = createServiceClient()
     const { data, error } = await supabase
       .from('customer_tags')
       .insert({
         organization_id: organizationId,
         customer_id: customerId,
         tag
       })
       .select()
       .single()

     if (error) {
       return NextResponse.json({ error: error.message }, { status: 400 })
     }

     return NextResponse.json(data, { status: 201 })
   })

   export const GET = withApiAuth(async (request, { organizationId }) => {
     const customerId = request.nextUrl.pathname.split('/')[4]

     const supabase = createServiceClient()
     const { data } = await supabase
       .from('customer_tags')
       .select('*')
       .eq('organization_id', organizationId)
       .eq('customer_id', customerId)

     return NextResponse.json(data)
   })
   ```

6. **Update UI components**
   ```typescript
   // src/components/customers/customer-tags.tsx
   'use client'

   export function CustomerTags({ customerId }: { customerId: string }) {
     const [tags, setTags] = useState<string[]>([])

     const addTag = async (tag: string) => {
       const res = await fetch(`/api/v1/customers/${customerId}/tags`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'X-Api-Key': apiKey
         },
         body: JSON.stringify({ tag })
       })

       if (res.ok) {
         const newTag = await res.json()
         setTags([...tags, newTag.tag])
       }
     }

     return (
       <div>
         {tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
         <Button onClick={() => addTag(inputValue)}>Add Tag</Button>
       </div>
     )
   }
   ```

7. **Add to customer detail page**
   ```typescript
   // src/app/(dashboard)/customers/[id]/page.tsx
   import { CustomerTags } from '@/components/customers/customer-tags'

   export default async function CustomerDetailPage({ params }) {
     // ... existing code

     return (
       <div>
         {/* ... existing content */}
         <CustomerTags customerId={customer.id} />
       </div>
     )
   }
   ```

8. **Test the feature**
   - Manual testing in browser
   - Test API endpoints with Postman/curl
   - Verify multi-tenancy isolation

9. **Commit changes**
   ```bash
   git add .
   git commit -m "Add customer tags feature"
   git push
   ```

### Database Changes

**Best Practices:**
- Always create migration files
- Never modify existing migrations
- Include RLS policies
- Add indexes for foreign keys
- Test with multiple organizations

**Migration Template:**
```sql
-- Migration: 012_feature_name.sql

-- Create table
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations NOT NULL,
  -- ... other columns
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_table_name_organization ON table_name(organization_id);

-- RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization isolation"
ON table_name FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Update function for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON table_name
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Testing Locally

**Test Multi-Tenancy:**
1. Create two organizations
2. Create data in org 1
3. Switch to org 2
4. Verify org 1 data is not visible
5. Create data in org 2
6. Switch back to org 1
7. Verify org 2 data is not visible

**Test API:**
```bash
# Get API key from /settings/api
export API_KEY="your_api_key_here"

# Test customer creation
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }'

# Test customer list
curl http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer $API_KEY"
```

**Test Checkout Flow:**
1. Create campaign at `/campaigns/new`
2. Create offer with product
3. Set campaign to active
4. Visit `/checkout?c=<campaign_id>&o=<offer_id>`
5. Complete checkout with test card (`4111111111111111` if DEMO_MODE)
6. Verify order created in `/orders`

---

## Common Debugging Tasks

### Debugging Authentication Issues

**Problem: User redirected to login after successful login**

Check:
1. Session cookie exists:
   ```typescript
   // In middleware.ts
   console.log('Session:', supabase.auth.getSession())
   ```

2. User profile has `current_organization_id`:
   ```sql
   SELECT * FROM user_profiles WHERE id = '<user_id>';
   ```

3. Organization membership is active:
   ```sql
   SELECT * FROM organization_members
   WHERE user_id = '<user_id>'
   AND status = 'active';
   ```

**Fix:**
```sql
-- Set current organization
UPDATE user_profiles
SET current_organization_id = '<org_id>'
WHERE id = '<user_id>';
```

### Debugging API Key Issues

**Problem: API returns 401 Unauthorized**

Check:
1. API key format: `sk_live_xxx` or `sk_test_xxx`
2. Header: `Authorization: Bearer <key>` or `X-Api-Key: <key>`
3. API key is active:
   ```sql
   SELECT * FROM api_settings WHERE api_key = '<key>';
   ```

4. Rate limits not exceeded:
   ```sql
   SELECT COUNT(*) FROM api_request_log
   WHERE api_key_id = '<key_id>'
   AND created_at > NOW() - INTERVAL '1 minute';
   ```

**Fix:**
```sql
-- Activate API key
UPDATE api_settings SET is_active = true WHERE id = '<key_id>';

-- Reset rate limit counters
DELETE FROM api_request_log
WHERE api_key_id = '<key_id>'
AND created_at < NOW() - INTERVAL '1 day';
```

### Debugging Payment Issues

**Problem: Payments always failing**

Check:
1. Gateway is configured:
   ```sql
   SELECT * FROM gateways
   WHERE organization_id = '<org_id>'
   AND is_active = true;
   ```

2. Campaign has gateway assigned:
   ```sql
   SELECT gateway_id FROM campaigns WHERE id = '<campaign_id>';
   ```

3. Spreedly credentials are valid:
   ```bash
   # Test Spreedly connection
   curl -u "$SPREEDLY_ENVIRONMENT_KEY:$SPREEDLY_ACCESS_SECRET" \
     https://core.spreedly.com/v1/gateways.json
   ```

4. Check transaction logs:
   ```sql
   SELECT * FROM transactions
   WHERE customer_id = '<customer_id>'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

**Common Error Codes:**
- `insufficient_funds` - Card has no balance
- `card_declined` - Bank declined transaction
- `invalid_card_number` - Card number is invalid
- `expired_card` - Card is expired
- `incorrect_cvc` - CVV is wrong

**Fix for testing:**
```env
# Enable demo mode
DEMO_MODE=true
```

### Debugging Database Query Issues

**Problem: Query returns no results but data exists**

Check:
1. Organization context:
   ```typescript
   // In Server Component
   const { organizationId } = await getOrganizationContext()
   console.log('Organization ID:', organizationId)
   ```

2. RLS policies:
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';

   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'customers';
   ```

3. Foreign key relationships:
   ```sql
   -- Check if record has correct organization_id
   SELECT * FROM customers WHERE id = '<customer_id>';
   ```

**Fix:**
```typescript
// Use service client to bypass RLS (for debugging)
const supabase = createServiceClient()
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('id', customerId)
```

### Debugging Checkout Flow

**Problem: Checkout fails at payment step**

Check browser console for errors:
1. Spreedly iFrame loading?
2. Payment token generated?
3. API request sent?
4. API response received?

**Add debugging:**
```typescript
// In checkout-form.tsx
const handlePayment = async (token) => {
  console.log('Payment token:', token)

  const payload = {
    customer_id: customerId,
    payment_method_token: token,
    // ...
  }
  console.log('Payload:', payload)

  const res = await fetch('/api/checkout/payment', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  const data = await res.json()
  console.log('Response:', data)

  if (!data.success) {
    console.error('Payment failed:', data.reason)
  }
}
```

**Check API logs:**
```sql
SELECT * FROM api_request_log
WHERE endpoint LIKE '%checkout%'
ORDER BY created_at DESC
LIMIT 20;
```

### Common SQL Queries for Debugging

```sql
-- Find orphaned records
SELECT c.* FROM customers c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE o.id IS NULL;

-- Check campaign analytics
SELECT
  c.name,
  ca.date,
  ca.views,
  ca.leads,
  ca.orders,
  ca.revenue
FROM campaign_analytics ca
JOIN campaigns c ON ca.campaign_id = c.id
WHERE ca.date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ca.date DESC;

-- Find failed transactions
SELECT
  t.*,
  c.email,
  o.total_amount
FROM transactions t
JOIN customers c ON t.customer_id = c.id
LEFT JOIN orders o ON t.order_id = o.id
WHERE t.status = 'failed'
ORDER BY t.created_at DESC
LIMIT 50;

-- Check API usage
SELECT
  api_key,
  COUNT(*) as total_requests,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration
FROM api_request_log
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY api_key;

-- Organization summary
SELECT
  o.name,
  o.plan,
  COUNT(DISTINCT om.user_id) as members,
  COUNT(DISTINCT c.id) as customers,
  COUNT(DISTINCT ord.id) as orders,
  COALESCE(SUM(ord.total_amount), 0) as total_revenue
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN customers c ON o.id = c.organization_id
LEFT JOIN orders ord ON o.id = ord.organization_id
GROUP BY o.id, o.name, o.plan;
```

---

## Feature Development Guide

### Adding a New Dashboard Page

**Example: Reports page**

1. **Create page file**
   ```bash
   mkdir -p "src/app/(dashboard)/reports"
   touch "src/app/(dashboard)/reports/page.tsx"
   ```

2. **Implement Server Component**
   ```typescript
   // src/app/(dashboard)/reports/page.tsx
   import { getOrganizationContext } from '@/lib/auth/organization-context'
   import { createClient } from '@/lib/supabase/server'

   export default async function ReportsPage() {
     const { organizationId } = await getOrganizationContext()
     const supabase = await createClient()

     // Fetch data
     const { data: orders } = await supabase
       .from('orders')
       .select('*, customer:customers(*)')
       .eq('organization_id', organizationId)
       .order('created_at', { ascending: false })
       .limit(100)

     // Calculate metrics
     const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
     const avgOrderValue = totalRevenue / (orders?.length || 1)

     return (
       <div className="p-8">
         <h1 className="text-3xl font-bold mb-8">Reports</h1>

         <div className="grid grid-cols-3 gap-4 mb-8">
           <Card>
             <CardHeader>Total Revenue</CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">
                 ${totalRevenue.toFixed(2)}
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>Total Orders</CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">
                 {orders?.length || 0}
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>Avg Order Value</CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">
                 ${avgOrderValue.toFixed(2)}
               </div>
             </CardContent>
           </Card>
         </div>

         <OrdersTable orders={orders} />
       </div>
     )
   }
   ```

3. **Add to sidebar**
   ```typescript
   // src/components/layouts/app-sidebar.tsx
   import { FileText } from 'lucide-react'

   const menuItems = [
     // ... existing items
     {
       title: 'Reports',
       icon: FileText,
       href: '/reports'
     }
   ]
   ```

4. **Test the page**
   - Navigate to `/reports`
   - Verify data loads
   - Check multi-tenancy (switch orgs)

### Adding a New API Endpoint

**Example: Bulk customer import**

1. **Create route file**
   ```bash
   mkdir -p "src/app/api/v1/customers/import"
   touch "src/app/api/v1/customers/import/route.ts"
   ```

2. **Implement handler**
   ```typescript
   // src/app/api/v1/customers/import/route.ts
   import { NextResponse } from 'next/server'
   import { withApiAuth } from '@/lib/api-auth'
   import { createServiceClient } from '@/lib/supabase/server'
   import { z } from 'zod'

   const importSchema = z.object({
     customers: z.array(z.object({
       email: z.string().email(),
       first_name: z.string().optional(),
       last_name: z.string().optional(),
       phone: z.string().optional(),
       custom_fields: z.record(z.any()).optional()
     }))
   })

   export const POST = withApiAuth(async (request, { organizationId }) => {
     try {
       const body = await request.json()
       const { customers } = importSchema.parse(body)

       const supabase = createServiceClient()

       // Upsert all customers
       const results = await Promise.all(
         customers.map(async (customer) => {
           const { data, error } = await supabase
             .from('customers')
             .upsert({
               organization_id: organizationId,
               ...customer,
               status: 'prospect'
             }, {
               onConflict: 'email,organization_id'
             })
             .select()
             .single()

           return { success: !error, data, error }
         })
       )

       const succeeded = results.filter(r => r.success).length
       const failed = results.filter(r => !r.success).length

       return NextResponse.json({
         imported: succeeded,
         failed: failed,
         results: results
       }, { status: 200 })

     } catch (error) {
       if (error instanceof z.ZodError) {
         return NextResponse.json({
           error: 'Validation error',
           details: error.errors
         }, { status: 400 })
       }

       return NextResponse.json({
         error: 'Import failed'
       }, { status: 500 })
     }
   })
   ```

3. **Test endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/v1/customers/import \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "customers": [
         {
           "email": "customer1@example.com",
           "first_name": "John",
           "last_name": "Doe"
         },
         {
           "email": "customer2@example.com",
           "first_name": "Jane",
           "last_name": "Smith"
         }
       ]
     }'
   ```

### Adding Client-Side Interactivity

**Example: Customer search with filters**

1. **Create client component**
   ```typescript
   // src/components/customers/customer-search.tsx
   'use client'

   import { useState } from 'react'
   import { useQuery } from '@tanstack/react-query'
   import { Input } from '@/components/ui/input'
   import { Select } from '@/components/ui/select'

   interface CustomerSearchProps {
     organizationId: string
   }

   export function CustomerSearch({ organizationId }: CustomerSearchProps) {
     const [search, setSearch] = useState('')
     const [status, setStatus] = useState<string>('all')

     const { data: customers, isLoading } = useQuery({
       queryKey: ['customers', search, status],
       queryFn: async () => {
         const params = new URLSearchParams()
         if (search) params.append('q', search)
         if (status !== 'all') params.append('status', status)

         const res = await fetch(`/api/customers/search?${params}`)
         return res.json()
       },
       enabled: search.length >= 3 || status !== 'all'
     })

     return (
       <div className="space-y-4">
         <div className="flex gap-4">
           <Input
             placeholder="Search customers..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />

           <Select value={status} onValueChange={setStatus}>
             <option value="all">All Statuses</option>
             <option value="prospect">Prospects</option>
             <option value="lead">Leads</option>
             <option value="customer">Customers</option>
           </Select>
         </div>

         {isLoading && <div>Loading...</div>}

         {customers && (
           <div className="grid gap-4">
             {customers.map((customer) => (
               <CustomerCard key={customer.id} customer={customer} />
             ))}
           </div>
         )}
       </div>
     )
   }
   ```

2. **Use in Server Component**
   ```typescript
   // src/app/(dashboard)/customers/page.tsx
   import { CustomerSearch } from '@/components/customers/customer-search'

   export default async function CustomersPage() {
     const { organizationId } = await getOrganizationContext()

     return (
       <div>
         <h1>Customers</h1>
         <CustomerSearch organizationId={organizationId} />
       </div>
     )
   }
   ```

### Environment-Specific Code

```typescript
// Check environment
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}

// Check demo mode
if (process.env.DEMO_MODE === 'true') {
  // Simulate payment
  return simulatePayment(cardNumber)
}

// Feature flags
if (process.env.NEXT_PUBLIC_ENABLE_NEW_CHECKOUT === 'true') {
  return <NewCheckoutFlow />
}
```

---

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**Error: Type errors**
```bash
# Regenerate types
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

**Error: Environment variables not found**
- Check `.env.local` exists
- Restart dev server after changes
- Use `NEXT_PUBLIC_` prefix for client-side variables

### Runtime Errors

**Error: Organization context failed**
- User not logged in → Redirect to `/login`
- No organization → Redirect to `/select-organization`
- Inactive membership → Contact organization owner

**Error: API returns 500**
- Check server logs in terminal
- Check Supabase logs in dashboard
- Check network tab in browser dev tools
- Add console.logs to API route

**Error: Data not showing**
- Check organization_id filter
- Check RLS policies
- Check user permissions
- Use service client for debugging

### Database Issues

**Error: Column does not exist**
- Migration not run → Apply migration
- Wrong table name → Check schema
- Typo in query → Fix column name

**Error: Foreign key constraint violation**
- Parent record doesn't exist
- Wrong organization_id
- Check referential integrity

**Error: Unique constraint violation**
- Record already exists
- Use upsert instead of insert
- Check unique indexes

### Performance Issues

**Slow page loads**
1. Check for N+1 queries
2. Add database indexes
3. Use select() to limit columns
4. Implement pagination
5. Add caching with React Query

**Example optimization:**
```typescript
// Before (N+1)
const orders = await supabase.from('orders').select('*')
for (const order of orders) {
  const customer = await supabase
    .from('customers')
    .select('*')
    .eq('id', order.customer_id)
    .single()
}

// After (1 query)
const orders = await supabase
  .from('orders')
  .select('*, customer:customers(*)')
```

### Deployment Issues

**Vercel deployment fails**
- Check environment variables set in Vercel dashboard
- Check build logs for errors
- Verify Supabase connection strings
- Check Node.js version compatibility

**Database migrations on production**
- Always test migrations locally first
- Back up production database before migrating
- Run migrations during low-traffic periods
- Have rollback plan ready

---

## Appendix

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
# (Use Supabase CLI or dashboard)

# Git
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
git pull                 # Pull from remote
```

### File Structure Reference

```
/Applications/Stealth Labz/custom-crm/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth pages
│   │   ├── (dashboard)/         # Protected pages
│   │   ├── (public)/            # Public pages
│   │   ├── api/                 # API routes
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   ├── ui/                  # Base UI components
│   │   ├── layouts/             # Layout components
│   │   ├── campaigns/           # Campaign components
│   │   ├── checkout/            # Checkout components
│   │   └── customers/           # Customer components
│   ├── lib/
│   │   ├── auth/                # Auth helpers
│   │   ├── supabase/            # Supabase clients
│   │   ├── spreedly/            # Spreedly client
│   │   └── api-auth.ts          # API auth
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # Auth middleware
├── supabase/
│   └── migrations/              # Database migrations
├── docs/                        # Documentation
├── public/                      # Static files
├── .env.local                   # Environment variables (local)
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── tailwind.config.ts           # Tailwind config
```

### Key Concepts

**Server Components vs Client Components:**
- Server Components: Default, run on server, can access database directly
- Client Components: Use `'use client'`, run in browser, need API for data
- Use Server Components for pages, Client Components for interactivity

**Multi-Tenancy:**
- Every table has `organization_id`
- RLS policies enforce data isolation
- User can belong to multiple organizations
- Current organization stored in user profile

**API Authentication:**
- Dashboard: Session-based (cookies)
- Public API: API key-based (Bearer token)
- Checkout: No auth (public endpoints)

**Payment Flow:**
- Card → Spreedly (tokenize) → Your API → Spreedly (charge) → Gateway
- Never touch raw card data
- Always log transactions

---

## Support & Resources

**Documentation:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Spreedly: https://docs.spreedly.com
- Tailwind: https://tailwindcss.com/docs
- Shadcn UI: https://ui.shadcn.com

**Internal Resources:**
- Codebase: `/Applications/Stealth Labz/custom-crm`
- Database Migrations: `supabase/migrations/`
- API Documentation: This file
- Spreedly Docs: `docs/spreedly/`

**Getting Help:**
- Check error logs in terminal
- Check Supabase dashboard logs
- Check browser console
- Search this document
- Review similar code in codebase

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Maintained By:** Development Team
