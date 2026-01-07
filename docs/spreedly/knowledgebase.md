# Konnektive-Style CRM Architecture Plan
## Leveraging Spreedly Payment Orchestration

---

# Part 1: System Architecture

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Admin Portal │  │ Customer     │  │ Checkout     │                 │
│  │ (Next.js)    │  │ Portal       │  │ Pages/Funnels│                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                               │
│              Laravel API (REST + Webhooks)                              │
└────────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   CORE CRM   │       │   PAYMENT    │       │  MARKETING   │
│   MODULES    │       │   ENGINE     │       │   ENGINE     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ • Customers  │       │ • Gateway    │       │ • Campaigns  │
│ • Products   │       │   Router     │       │ • Funnels    │
│ • Orders     │       │ • Transaction│       │ • Upsells    │
│ • Inventory  │       │   Processor  │       │ • Affiliates │
└──────────────┘       │ • Subscription│      └──────────────┘
                       │   Manager    │
                       │ • Dunning    │
                       └──────┬───────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │     SPREEDLY     │
                    │  Payment Layer   │
                    └────────┬─────────┘
                             │
         ┌─────────┬─────────┼─────────┬─────────┐
         ▼         ▼         ▼         ▼         ▼
      Stripe    NMI    Authorize   Braintree   100+
                         .net                  more
```

---

## Module Breakdown

### Module 1: Customer Management
**Purpose:** Central customer database with payment methods, addresses, and history

**Entities:**
- Customer (profile, contact info, metadata)
- CustomerAddress (billing/shipping addresses)
- CustomerPaymentMethod (Spreedly tokens, card info)
- CustomerNote (internal notes, flags)

**Spreedly Integration Points:**
- `POST /payment_methods` → Tokenize new cards
- `PUT /payment_methods/{token}/retain` → Keep cards on file
- `PUT /payment_methods/{token}/redact` → Delete card data

---

### Module 2: Product & Catalog Management
**Purpose:** Products, pricing, variants, and inventory

**Entities:**
- Product (name, SKU, description)
- ProductVariant (size, color, options)
- ProductPrice (amount, currency, billing type)
- InventoryItem (stock levels, warehouse)

**Key Features:**
- One-time purchase products
- Subscription products (recurring)
- Trial periods and setup fees
- Multi-currency pricing

---

### Module 3: Gateway Management
**Purpose:** Configure and manage multiple payment processors

**Entities:**
- Gateway (Spreedly gateway token, credentials)
- GatewayRule (routing conditions)
- GatewayMetrics (volume, approvals, declines)

**Spreedly Integration Points:**
- `POST /gateways` → Create gateway connections
- `GET /gateways/{token}` → Check gateway status
- `GET /gateways/{token}/transactions` → Gateway transaction history

**Routing Logic Criteria:**
- Monthly volume caps
- Currency support
- Card type acceptance
- BIN-based routing
- Geographic routing
- Cascade on decline

---

### Module 4: Order Processing
**Purpose:** Order lifecycle from cart to fulfillment

**Entities:**
- Order (totals, status, timestamps)
- OrderItem (products, quantities, prices)
- OrderTransaction (payment attempts, results)
- OrderFulfillment (shipping, tracking)

**Spreedly Integration Points:**
- `POST /gateways/{token}/authorize` → Auth only
- `POST /gateways/{token}/purchase` → Auth + capture
- `POST /transactions/{token}/capture` → Capture auth
- `POST /transactions/{token}/void` → Cancel auth
- `POST /transactions/{token}/credit` → Refund

**Order States:**
```
pending → processing → paid → fulfilling → shipped → completed
                  ↓
              declined → retry → cancelled
                  ↓
              refunded (partial/full)
```

---

### Module 5: Subscription Engine
**Purpose:** Recurring billing and subscription lifecycle

**Entities:**
- Subscription (customer, product, billing cycle)
- SubscriptionPeriod (billing periods)
- SubscriptionInvoice (charges per period)
- SubscriptionEvent (lifecycle events log)

**Spreedly Integration Points:**
- Recurring `purchase` with stored credentials
- `stored_credential_initiator: merchant`
- `stored_credential_usage: used`

**Subscription States:**
```
trialing → active → past_due → cancelled
              ↓          ↓
           paused    churned
```

---

### Module 6: Dunning & Recovery
**Purpose:** Recover failed payments automatically

**Components:**
- Retry scheduler (configurable intervals)
- Card updater (Spreedly Card Refresher)
- Customer notifications
- Escalation rules

**Spreedly Integration Points:**
- `POST /card_refresher/inquiries` → Get updated card data
- Network tokenization for better approval rates

---

### Module 7: Campaign & Funnel Engine
**Purpose:** Sales campaigns, checkout flows, upsells

**Entities:**
- Campaign (name, status, default settings)
- Funnel (page sequence, tracking)
- FunnelStep (landing, checkout, upsell, thank you)
- Offer (product + price + gateway rules)
- Upsell (trigger conditions, products)

**Features:**
- A/B testing
- One-click upsells (use stored payment method)
- Order bumps
- Downsells on decline

---

### Module 8: Affiliate & Tracking
**Purpose:** Affiliate management and attribution

**Entities:**
- Affiliate (profile, payment info)
- AffiliateLink (tracking URLs)
- Commission (earned, pending, paid)
- Payout (affiliate payments)

---

### Module 9: Reporting & Analytics
**Purpose:** Business intelligence dashboards

**Key Metrics:**
- Gross/net revenue
- Approval rates by gateway
- Chargeback ratios
- MRR/ARR (subscriptions)
- LTV calculations
- Funnel conversion rates
- Affiliate performance

---

## Database Design Overview

```
CUSTOMERS                    PAYMENTS                    COMMERCE
─────────                    ────────                    ────────
customers                    gateways                    products
customer_addresses           gateway_rules               product_variants
customer_payment_methods     transactions                product_prices
customer_notes               transaction_logs            inventory_items

SUBSCRIPTIONS               CAMPAIGNS                    AFFILIATES
─────────────               ─────────                    ──────────
subscriptions               campaigns                    affiliates
subscription_periods        funnels                      affiliate_links
subscription_invoices       funnel_steps                 commissions
dunning_attempts            offers                       payouts
                            upsells
```

---

## Integration Architecture

### Webhook Flow (Inbound)
```
Spreedly Event → Your Webhook Endpoint → Event Processor → Update State
                                                        → Trigger Actions
                                                        → Send Notifications
```

### API Flow (Outbound)
```
Your Action → Payment Service → Spreedly API → Gateway → Response
                  ↓
           Log Transaction → Update Order → Notify Customer
```

---

## Security Best Practices

### Payment Data Security
- Never store full card numbers - only Spreedly tokens
- Use Spreedly's PCI-compliant vault for sensitive data
- Implement proper access controls for payment methods
- Encrypt sensitive data at rest

### API Security
- Verify webhook signatures from Spreedly
- Use environment variables for API credentials
- Implement rate limiting on public endpoints
- Enable audit logging for all payment operations

### Compliance
- PCI DSS compliance via Spreedly
- GDPR compliance for customer data
- Implement data retention policies
- Support customer data export/deletion requests

---

## Performance Considerations

### Caching Strategy
- Cache gateway routing rules
- Cache product catalog data
- Use Redis for session management
- Implement dashboard metric caching

### Database Optimization
- Index foreign keys and frequently queried fields
- Use database views for complex reports
- Implement read replicas for analytics
- Archive old transaction data

### Queue Management
- Process webhooks asynchronously
- Queue subscription billing jobs
- Queue report generation
- Implement retry logic with exponential backoff

---

## Monitoring & Alerting

### Key Metrics to Monitor
- Payment gateway uptime
- Transaction success rates
- API response times
- Queue processing delays
- Failed payment recovery rates

### Alerts to Configure
- Gateway downtime or high decline rates
- Subscription billing failures
- Webhook processing errors
- Volume cap approaching for gateways
- High chargeback ratios
