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
- [ ] Database server (MySQL/PostgreSQL)
- [ ] Redis server
- [ ] Email service provider

### Development Environment
- [ ] Laravel 11 installed
- [ ] Node.js and npm
- [ ] Docker (optional but recommended)
- [ ] Git repository initialized

---

## Initial Setup

### Step 1: Configure Spreedly Credentials

Add to your `.env` file:
```env
SPREEDLY_ENVIRONMENT_KEY=your_environment_key
SPREEDLY_ACCESS_SECRET=your_access_secret
SPREEDLY_API_URL=https://core.spreedly.com/v1
```

### Step 2: Install Required Packages

```bash
composer require guzzlehttp/guzzle
composer require laravel/sanctum
composer require spatie/laravel-webhook-client
npm install --save-dev @types/node
```

### Step 3: Create Base Configuration

Create `config/spreedly.php`:
```php
<?php

return [
    'environment_key' => env('SPREEDLY_ENVIRONMENT_KEY'),
    'access_secret' => env('SPREEDLY_ACCESS_SECRET'),
    'api_url' => env('SPREEDLY_API_URL', 'https://core.spreedly.com/v1'),
    'webhook_secret' => env('SPREEDLY_WEBHOOK_SECRET'),
];
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
Create a new Laravel 11 project for a CRM system with payment processing.

Project name: custom-crm

Requirements:
- Laravel 11 with API routes
- MySQL database
- Redis for queues and caching
- Laravel Sanctum for API authentication

Directory structure should follow domain-driven design:
- app/Domain/Customer
- app/Domain/Payment
- app/Domain/Order
- app/Domain/Subscription
- app/Domain/Campaign

Create the initial project structure with:
1. Base service provider for each domain
2. Common traits (HasUuid, Auditable)
3. Base API response formatting
4. Exception handling for API responses
5. Configuration files for Spreedly credentials

Do not generate actual code yet - first outline the complete
directory structure and confirm the approach.
```

---

### Prompt 2: Spreedly Service Wrapper

```
Create a Spreedly API service wrapper for the CRM.

Requirements:
1. Service class: app/Services/SpreedlyService.php
2. HTTP client using Guzzle
3. Base64 authentication with environment key + secret
4. Methods for:
   - tokenizePaymentMethod(cardData)
   - retainPaymentMethod(token)
   - redactPaymentMethod(token)
   - createGateway(type, credentials)
   - authorizeTransaction(gatewayToken, paymentMethodToken, amount)
   - purchaseTransaction(gatewayToken, paymentMethodToken, amount)
   - captureTransaction(transactionToken, amount)
   - refundTransaction(transactionToken, amount)
   - voidTransaction(transactionToken)

5. Error handling with custom exceptions
6. Request/response logging
7. Retry logic with exponential backoff

Include comprehensive PHPDoc comments and type hints.
```

---

### Prompt 3: Customer Module

```
Build the Customer domain module for the CRM.

Context: This is part of a Konnektive-style CRM using Spreedly
for payment processing.

Module scope:
1. Customer entity with profile data (name, email, phone)
2. CustomerAddress entity (billing/shipping, multiple per customer)
3. CustomerPaymentMethod entity storing Spreedly payment tokens
4. CustomerNote for internal annotations

Required components:
- Migrations for all tables
- Eloquent models with relationships
- Form request validators
- Service class (CustomerService) with business logic
- API resource transformers
- RESTful controller with CRUD operations
- Policy for authorization

Spreedly integration requirements:
- When adding payment method, call Spreedly to tokenize
- Store only: spreedly_token, card_type, last_four, exp_month, exp_year
- Never store full card numbers
- Support setting default payment method
- Support soft-deleting (redacting) payment methods via Spreedly

API endpoints needed:
- GET/POST /api/customers
- GET/PUT/DELETE /api/customers/{id}
- GET/POST /api/customers/{id}/addresses
- GET/POST /api/customers/{id}/payment-methods
- DELETE /api/customers/{id}/payment-methods/{pm_id}

Include database seeders with test data.
```

---

### Prompt 4: Gateway Management Module

```
Build the Gateway Management module for multi-processor payment routing.

Context: This CRM uses Spreedly as payment orchestration layer,
connecting to multiple payment gateways (Stripe, NMI, Authorize.net, etc.)

Module scope:
1. Gateway entity - stores Spreedly gateway tokens and configuration
2. GatewayRule entity - routing rules and conditions
3. GatewayMetric entity - tracks volume, approval rates

Gateway configuration fields:
- name, spreedly_gateway_token, gateway_type
- is_active, priority (for routing order)
- monthly_cap, current_month_volume
- accepted_currencies (JSON array)
- accepted_card_types (JSON array)
- min_amount, max_amount
- descriptor (statement descriptor)

Routing logic requirements:
- Select gateway based on: currency, card type, amount, volume cap
- Support priority-based selection
- Support cascade routing (try next gateway on decline)
- Track metrics per gateway (volume, approval rate)

Service class methods needed:
- createGateway(type, credentials) - calls Spreedly POST /gateways
- selectGateway(order) - returns best gateway based on rules
- cascadeGateways(order) - returns ordered list for retry
- updateMetrics(gateway, transaction) - track performance
- checkVolumeCaps() - alert when approaching limits

Build admin API endpoints for gateway CRUD and metrics viewing.
```

---

### Prompt 5: Transaction Processing Module

```
Build the Transaction Processing engine for the CRM.

Context: This module handles all payment operations through Spreedly,
supporting authorize, capture, purchase, refund, and void operations.

Module scope:
1. Transaction entity - records all payment attempts
2. TransactionLog entity - detailed request/response logging
3. PaymentService - orchestrates payment operations

Transaction entity fields:
- order_id, customer_id, gateway_id
- spreedly_transaction_token
- type (authorize/capture/purchase/refund/void)
- status (pending/succeeded/declined/error)
- amount, currency
- response_code, response_message, avs_result, cvv_result
- metadata (JSON for additional data)

Spreedly API integration:
- POST /gateways/{token}/authorize - auth only
- POST /gateways/{token}/purchase - auth + capture
- POST /transactions/{token}/capture - capture auth
- POST /transactions/{token}/credit - refund
- POST /transactions/{token}/void - cancel auth

PaymentService methods:
- authorize(order, paymentMethod, gateway)
- capture(transaction, amount = null) - full or partial
- purchase(order, paymentMethod, gateway)
- refund(transaction, amount = null) - full or partial
- void(transaction)

Requirements:
- All Spreedly requests/responses must be logged
- Handle Spreedly error responses gracefully
- Map Spreedly response codes to internal status
- Support idempotency keys to prevent duplicates
- Emit events for transaction state changes

Build internal service only - no public API endpoints for direct
transaction creation (transactions created through Order module).
```

---

### Prompt 6: Subscription Engine

```
Build the Subscription Billing engine for recurring payments.

Context: Handles subscription lifecycle, recurring billing, and
integrates with Dunning module for failed payment recovery.

Module scope:
1. Subscription entity - subscription records
2. SubscriptionPeriod - billing periods
3. SubscriptionInvoice - charges per period
4. SubscriptionEvent - lifecycle event log

Subscription entity fields:
- customer_id, product_id, payment_method_id
- status (trialing/active/past_due/paused/cancelled)
- billing_interval (day/week/month/year)
- billing_interval_count (e.g., 2 for bi-monthly)
- amount, currency
- trial_ends_at, current_period_start, current_period_end
- next_billing_date
- cancelled_at, cancel_reason

SubscriptionService methods:
- create(customer, product, paymentMethod, options)
- activate(subscription) - end trial, start billing
- pause(subscription, resumeDate = null)
- resume(subscription)
- cancel(subscription, immediately = false, reason)
- changePlan(subscription, newProduct, prorate = true)
- changePaymentMethod(subscription, newPaymentMethod)

Billing job (scheduled):
- Query subscriptions where next_billing_date <= today
- For each: create invoice, attempt charge
- On success: advance billing period, log event
- On failure: hand off to Dunning module

Spreedly stored credentials:
- Initial transaction: stored_credential_initiator: cardholder
- Recurring: stored_credential_initiator: merchant,
             stored_credential_usage: used

Build scheduled command for daily billing runs.
Build API for subscription management.
```

---

### Prompt 7: Webhook Handler

```
Build the Webhook handling system for Spreedly events.

Context: Receives and processes webhook events from Spreedly
to keep transaction and payment method states synchronized.

Module scope:
1. WebhookEvent entity - log all incoming webhooks
2. WebhookProcessor - routes events to handlers
3. Event-specific handlers

WebhookEvent fields:
- source (spreedly)
- event_type
- payload (JSON)
- status (received/processing/processed/failed)
- processed_at

Spreedly events to handle:
- transaction.succeeded
- transaction.failed
- transaction.pending
- payment_method.updated
- payment_method.redacted
- gateway.redacted

Handler actions:
- transaction.succeeded: Update transaction status,
  trigger order/subscription success flows
- transaction.failed: Update status, trigger dunning if subscription
- payment_method.updated: Sync card details (exp date, etc.)

Security requirements:
- Verify webhook signatures (Spreedly signing secret)
- Idempotency - don't process same event twice
- Queue processing for reliability
- Retry failed handlers

Build:
- POST /api/webhooks/spreedly endpoint
- Signature verification middleware
- Event dispatcher to appropriate handlers
- Failed webhook retry mechanism
```

---

## Testing Strategy

### Unit Tests
```bash
# Test individual services
php artisan test --filter=SpreedlyServiceTest
php artisan test --filter=CustomerServiceTest
php artisan test --filter=PaymentServiceTest
```

### Integration Tests
```bash
# Test Spreedly API integration
php artisan test --filter=SpreedlyIntegrationTest

# Use test credentials and test gateway
# Spreedly test cards: 4111111111111111 (success)
```

### E2E Tests
```bash
# Test complete order flow
php artisan test --filter=OrderProcessingTest

# Test subscription billing
php artisan test --filter=SubscriptionBillingTest
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Queue workers configured
- [ ] Webhook endpoints secured with SSL

### Production Setup
- [ ] Switch Spreedly to production credentials
- [ ] Configure production gateways
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Enable audit logging

### Post-Deployment
- [ ] Verify webhook delivery
- [ ] Test transaction processing
- [ ] Monitor error rates
- [ ] Check queue processing
- [ ] Verify email notifications

---

## Common Issues & Solutions

### Issue: Webhooks not being received
**Solution:** Check Spreedly webhook configuration, verify SSL certificate, check firewall rules

### Issue: Gateway timeouts
**Solution:** Implement retry logic, use cascade routing to alternate gateways

### Issue: Card tokenization failing
**Solution:** Verify card data format, check Spreedly error messages, ensure PCI compliance

### Issue: Subscription billing not running
**Solution:** Check scheduled tasks, verify queue workers are running, check for failed jobs

---

## Support Resources

### Spreedly Documentation
- API Reference: https://docs.spreedly.com/reference/api/v1/
- Payment Methods: https://docs.spreedly.com/reference/api/v1/#payment-methods
- Gateways: https://docs.spreedly.com/reference/api/v1/#gateways
- Webhooks: https://docs.spreedly.com/guides/webhooks/

### Laravel Resources
- Laravel Queue Documentation
- Laravel Sanctum for API auth
- Laravel Horizon for queue monitoring
- Laravel Telescope for debugging

---

## Next Steps

After completing basic implementation:
1. Implement advanced fraud detection
2. Add multi-currency support
3. Build custom reporting dashboards
4. Implement A/B testing for funnels
5. Add mobile app API endpoints
