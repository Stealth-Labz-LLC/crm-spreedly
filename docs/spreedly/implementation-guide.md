# Spreedly Integration Implementation Guide
## Practical Step-by-Step Implementation for CRM

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Module Implementation Order](#module-implementation-order)
4. [Claude Code Prompt Library](#claude-code-prompt-library)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

### Required Accounts
- [ ] Spreedly account (test environment)
- [ ] Payment gateway accounts (Stripe, NMI, etc.)
- [ ] Supabase account (database & authentication)
- [ ] Email service provider (optional)
- [ ] Vercel account (for deployment)

### Development Environment
- [ ] Node.js 18+ and npm
- [ ] Next.js 16+ installed
- [ ] TypeScript
- [ ] Git repository initialized
- [ ] Docker (optional but recommended)

---

## Initial Setup

### Step 1: Configure Environment Variables

Add to your `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Spreedly
SPREEDLY_ENVIRONMENT_KEY=your_environment_key
SPREEDLY_ACCESS_SECRET=your_access_secret
SPREEDLY_SIGNING_SECRET=your_signing_secret

# Demo Mode (optional)
DEMO_MODE=true
```

### Step 2: Install Required Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query
npm install axios
npm install date-fns
```

### Step 3: Create Base Configuration

Create `lib/config/spreedly.ts`:
```typescript
export const spreedlyConfig = {
  environmentKey: process.env.SPREEDLY_ENVIRONMENT_KEY!,
  accessSecret: process.env.SPREEDLY_ACCESS_SECRET!,
  apiUrl: 'https://core.spreedly.com/v1',
  signingSecret: process.env.SPREEDLY_SIGNING_SECRET!,
} as const;
```

---

## Module Implementation Order

### Phase 1: Foundation (Week 1)
1. [ ] Project structure setup
2. [ ] Base traits and utilities
3. [ ] Spreedly service wrapper
4. [ ] Authentication system

### Phase 2: Core CRM (Week 2-3)
5. [ ] Customer management module
6. [ ] Product catalog module
7. [ ] Address management

### Phase 3: Payment Processing (Week 4-5)
8. [ ] Gateway management module
9. [ ] Payment method tokenization
10. [ ] Transaction processing engine

### Phase 4: Order Management (Week 6-7)
11. [ ] Order creation and processing
12. [ ] Payment capture and refunds
13. [ ] Fulfillment tracking

### Phase 5: Subscriptions (Week 8-9)
14. [ ] Subscription engine
15. [ ] Recurring billing
16. [ ] Dunning and recovery

### Phase 6: Advanced Features (Week 10-12)
17. [ ] Campaign and funnel system
18. [ ] Affiliate tracking
19. [ ] Reporting and analytics
20. [ ] Webhook handling

---

## Claude Code Prompt Library

### Prompt 1: Initial Project Setup

```
Set up a Next.js 16+ project structure for a CRM system with payment processing.

Project name: custom-crm

Requirements:
- Next.js 16+ with App Router
- TypeScript
- Supabase for database and authentication
- TanStack React Query for data fetching
- React Hook Form + Zod for forms

Directory structure should follow feature-based organization:
- app/ (Next.js App Router pages and API routes)
- lib/supabase/ (Supabase client utilities)
- lib/services/ (business logic services)
- lib/types/ (TypeScript types and interfaces)
- lib/utils/ (shared utilities)
- components/ (React components)
- hooks/ (custom React hooks)

Create the initial project structure with:
1. Supabase client setup (browser and server)
2. Base service classes for API communication
3. Common types and interfaces
4. API response formatting utilities
5. Error handling middleware for API routes
6. Configuration for Spreedly integration

Do not generate actual code yet - first outline the complete
directory structure and confirm the approach.
```

---

### Prompt 2: Spreedly Service Wrapper

```
Create a Spreedly API service wrapper for the CRM.

Requirements:
1. Service class: lib/services/spreedly.ts
2. HTTP client using axios
3. Base64 authentication with environment key + secret
4. TypeScript class with methods for:
   - tokenizePaymentMethod(cardData: CardData): Promise<PaymentMethodToken>
   - retainPaymentMethod(token: string): Promise<void>
   - redactPaymentMethod(token: string): Promise<void>
   - createGateway(type: string, credentials: GatewayCredentials): Promise<Gateway>
   - authorizeTransaction(params: AuthorizeParams): Promise<Transaction>
   - purchaseTransaction(params: PurchaseParams): Promise<Transaction>
   - captureTransaction(transactionToken: string, amount?: number): Promise<Transaction>
   - refundTransaction(transactionToken: string, amount?: number): Promise<Transaction>
   - voidTransaction(transactionToken: string): Promise<Transaction>

5. Error handling with custom TypeScript error classes
6. Request/response logging to Supabase logs table
7. Retry logic with exponential backoff using axios-retry

Include comprehensive JSDoc comments and full TypeScript types.
Create corresponding TypeScript interfaces for all request/response objects.
```

---

### Prompt 3: Customer Module

```
Build the Customer domain module for the CRM.

Context: This is part of a Konnektive-style CRM using Spreedly
for payment processing, built with Next.js and Supabase.

Module scope:
1. Customer table in Supabase with profile data (name, email, phone)
2. CustomerAddress table (billing/shipping, multiple per customer)
3. CustomerPaymentMethod table storing Spreedly payment tokens
4. CustomerNote table for internal annotations

Required components:
- Supabase migrations for all tables with RLS policies
- TypeScript types/interfaces for all entities
- Zod schemas for form validation
- Service class (lib/services/customer.ts) with business logic
- React components for customer UI
- Next.js API routes for CRUD operations (app/api/customers/route.ts)
- Custom React hooks for data fetching

Spreedly integration requirements:
- When adding payment method, call Spreedly to tokenize
- Store only: spreedly_token, card_type, last_four, exp_month, exp_year
- Never store full card numbers
- Support setting default payment method
- Support soft-deleting (redacting) payment methods via Spreedly

API endpoints needed (Next.js API routes):
- GET/POST /api/customers
- GET/PUT/DELETE /api/customers/[id]
- GET/POST /api/customers/[id]/addresses
- GET/POST /api/customers/[id]/payment-methods
- DELETE /api/customers/[id]/payment-methods/[pmId]

Include Supabase seed data with test customers.
```

---

### Prompt 4: Gateway Management Module

```
Build the Gateway Management module for multi-processor payment routing.

Context: This CRM uses Spreedly as payment orchestration layer,
connecting to multiple payment gateways (Stripe, NMI, Authorize.net, etc.)
Built with Next.js, TypeScript, and Supabase.

Module scope:
1. Gateway table - stores Spreedly gateway tokens and configuration
2. GatewayRule table - routing rules and conditions
3. GatewayMetric table - tracks volume, approval rates

Gateway table fields (Supabase):
- id (uuid), name, spreedly_gateway_token, gateway_type
- is_active (boolean), priority (integer)
- monthly_cap (numeric), current_month_volume (numeric)
- accepted_currencies (jsonb array)
- accepted_card_types (jsonb array)
- min_amount (numeric), max_amount (numeric)
- descriptor (text)

Routing logic requirements:
- Select gateway based on: currency, card type, amount, volume cap
- Support priority-based selection
- Support cascade routing (try next gateway on decline)
- Track metrics per gateway (volume, approval rate)

Service class methods needed (lib/services/gateway.ts):
- createGateway(type, credentials) - calls Spreedly POST /gateways
- selectGateway(order) - returns best gateway based on rules
- cascadeGateways(order) - returns ordered list for retry
- updateMetrics(gateway, transaction) - track performance
- checkVolumeCaps() - alert when approaching limits

Build Next.js API routes for gateway CRUD and metrics viewing.
Include TypeScript types and Zod validation schemas.
```

---

### Prompt 5: Transaction Processing Module

```
Build the Transaction Processing engine for the CRM.

Context: This module handles all payment operations through Spreedly,
supporting authorize, capture, purchase, refund, and void operations.
Built with Next.js, TypeScript, and Supabase.

Module scope:
1. Transaction table - records all payment attempts
2. TransactionLog table - detailed request/response logging
3. PaymentService (lib/services/payment.ts) - orchestrates payment operations

Transaction table fields (Supabase):
- id (uuid), order_id (uuid), customer_id (uuid), gateway_id (uuid)
- spreedly_transaction_token (text)
- type (enum: authorize/capture/purchase/refund/void)
- status (enum: pending/succeeded/declined/error)
- amount (numeric), currency (text)
- response_code (text), response_message (text)
- avs_result (text), cvv_result (text)
- metadata (jsonb)
- created_at, updated_at

Spreedly API integration:
- POST /gateways/{token}/authorize - auth only
- POST /gateways/{token}/purchase - auth + capture
- POST /transactions/{token}/capture - capture auth
- POST /transactions/{token}/credit - refund
- POST /transactions/{token}/void - cancel auth

PaymentService methods (TypeScript):
- authorize(order, paymentMethod, gateway): Promise<Transaction>
- capture(transaction, amount?): Promise<Transaction>
- purchase(order, paymentMethod, gateway): Promise<Transaction>
- refund(transaction, amount?): Promise<Transaction>
- void(transaction): Promise<Transaction>

Requirements:
- All Spreedly requests/responses must be logged to Supabase
- Handle Spreedly error responses gracefully with try/catch
- Map Spreedly response codes to internal status enum
- Support idempotency keys to prevent duplicates
- Use Supabase Realtime for transaction status updates

Build internal service only - no public API endpoints for direct
transaction creation (transactions created through Order module).
Include full TypeScript types and interfaces.
```

---

### Prompt 6: Subscription Engine

```
Build the Subscription Billing engine for recurring payments.

Context: Handles subscription lifecycle, recurring billing, and
integrates with Dunning module for failed payment recovery.
Built with Next.js, TypeScript, and Supabase.

Module scope:
1. Subscription table - subscription records
2. SubscriptionPeriod table - billing periods
3. SubscriptionInvoice table - charges per period
4. SubscriptionEvent table - lifecycle event log

Subscription table fields (Supabase):
- id (uuid), customer_id (uuid), product_id (uuid), payment_method_id (uuid)
- status (enum: trialing/active/past_due/paused/cancelled)
- billing_interval (enum: day/week/month/year)
- billing_interval_count (integer)
- amount (numeric), currency (text)
- trial_ends_at, current_period_start, current_period_end (timestamp)
- next_billing_date (date)
- cancelled_at (timestamp), cancel_reason (text)

SubscriptionService methods (lib/services/subscription.ts):
- create(customer, product, paymentMethod, options): Promise<Subscription>
- activate(subscription): Promise<Subscription>
- pause(subscription, resumeDate?): Promise<Subscription>
- resume(subscription): Promise<Subscription>
- cancel(subscription, immediately?, reason?): Promise<Subscription>
- changePlan(subscription, newProduct, prorate?): Promise<Subscription>
- changePaymentMethod(subscription, newPaymentMethod): Promise<Subscription>

Billing job (Vercel Cron or Supabase Edge Function):
- Query subscriptions where next_billing_date <= today
- For each: create invoice, attempt charge
- On success: advance billing period, log event
- On failure: hand off to Dunning module

Spreedly stored credentials:
- Initial transaction: stored_credential_initiator: cardholder
- Recurring: stored_credential_initiator: merchant,
             stored_credential_usage: used

Build Next.js API route for cron job: /api/cron/billing
Build API routes for subscription management.
Include TypeScript types and Zod schemas.
```

---

### Prompt 7: Webhook Handler

```
Build the Webhook handling system for Spreedly events.

Context: Receives and processes webhook events from Spreedly
to keep transaction and payment method states synchronized.
Built with Next.js, TypeScript, and Supabase.

Module scope:
1. WebhookEvent table - log all incoming webhooks
2. WebhookProcessor service - routes events to handlers
3. Event-specific handler functions

WebhookEvent table fields (Supabase):
- id (uuid), source (text, default: 'spreedly')
- event_type (text)
- payload (jsonb)
- status (enum: received/processing/processed/failed)
- processed_at (timestamp)
- created_at (timestamp)

Spreedly events to handle:
- transaction.succeeded
- transaction.failed
- transaction.pending
- payment_method.updated
- payment_method.redacted
- gateway.redacted

Handler actions:
- transaction.succeeded: Update transaction status in Supabase,
  trigger order/subscription success flows
- transaction.failed: Update status, trigger dunning if subscription
- payment_method.updated: Sync card details (exp date, etc.)

Security requirements:
- Verify webhook signatures using Spreedly signing secret
- Idempotency - check for duplicate event_id before processing
- Use Supabase Edge Functions or Next.js API routes
- Store failed webhooks for manual review

Build:
- Next.js API route: app/api/webhooks/spreedly/route.ts
- Signature verification function
- Event dispatcher with TypeScript pattern matching
- Webhook event handlers (lib/webhooks/handlers/)
- Include full TypeScript types and error handling
```

---

## Testing Strategy

### Unit Tests
```bash
# Test individual services using Jest or Vitest
npm test services/spreedly.test.ts
npm test services/customer.test.ts
npm test services/payment.test.ts
```

### Integration Tests
```bash
# Test Spreedly API integration
npm test integration/spreedly.test.ts

# Use test credentials and test gateway
# Spreedly test cards: 4111111111111111 (success)
# Use Supabase local development or test project
```

### E2E Tests
```bash
# Test complete order flow using Playwright or Cypress
npm run test:e2e -- order-processing.spec.ts

# Test subscription billing
npm run test:e2e -- subscription-billing.spec.ts

# Run all tests
npm test
```

### API Route Tests
```bash
# Test Next.js API routes
npm test api/customers.test.ts
npm test api/webhooks/spreedly.test.ts
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (npm test)
- [ ] Environment variables configured in Vercel
- [ ] Supabase migrations deployed to production
- [ ] Build successful (npm run build)
- [ ] Webhook endpoints secured with SSL
- [ ] Type checking passes (npm run type-check)

### Production Setup
- [ ] Switch Spreedly to production credentials in Vercel
- [ ] Configure production gateways in Spreedly dashboard
- [ ] Set up Vercel Analytics and monitoring
- [ ] Configure Supabase database backups
- [ ] Enable Supabase audit logging
- [ ] Set up cron jobs in Vercel for subscription billing

### Post-Deployment
- [ ] Verify webhook delivery to /api/webhooks/spreedly
- [ ] Test transaction processing with real payment
- [ ] Monitor error rates in Vercel logs
- [ ] Check Supabase Edge Function execution
- [ ] Verify email notifications (if configured)

---

## Common Issues & Solutions

### Issue: Webhooks not being received
**Solution:** Check Spreedly webhook configuration, verify SSL certificate, check firewall rules

### Issue: Gateway timeouts
**Solution:** Implement retry logic, use cascade routing to alternate gateways

### Issue: Card tokenization failing
**Solution:** Verify card data format, check Spreedly error messages, ensure PCI compliance

### Issue: Subscription billing not running
**Solution:** Check Vercel cron configuration, verify API route is accessible, check Supabase logs for errors

---

## Support Resources

### Spreedly Documentation
- API Reference: https://docs.spreedly.com/reference/api/v1/
- Payment Methods: https://docs.spreedly.com/reference/api/v1/#payment-methods
- Gateways: https://docs.spreedly.com/reference/api/v1/#gateways
- Webhooks: https://docs.spreedly.com/guides/webhooks/

### Next.js & Supabase Resources
- Next.js App Router Documentation: https://nextjs.org/docs/app
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript
- Supabase Auth: https://supabase.com/docs/guides/auth
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- TanStack React Query: https://tanstack.com/query/latest/docs/react/overview

---

## Next Steps

After completing basic implementation:
1. Implement advanced fraud detection
2. Add multi-currency support
3. Build custom reporting dashboards
4. Implement A/B testing for funnels
5. Add mobile app API endpoints
