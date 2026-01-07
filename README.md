# Custom CRM - Payment Processing System

A Konnektive-style CRM with advanced payment processing capabilities, built with Next.js, TypeScript, and Supabase, integrated with Spreedly for payment orchestration.

## Overview

This CRM system provides comprehensive customer management, payment processing, subscription billing, and marketing campaign functionality for e-commerce businesses.

### Key Features

- **Customer Management** - Complete customer profiles, addresses, and payment methods
- **Multi-Gateway Payment Processing** - Process payments through multiple processors (Stripe, NMI, Authorize.net, etc.)
- **Intelligent Gateway Routing** - Smart payment routing based on rules, volume caps, and performance
- **Subscription Billing** - Automated recurring payments with trial periods and flexible billing cycles
- **Dunning & Recovery** - Automated failed payment recovery system
- **Campaign & Funnel Engine** - Build high-converting sales funnels with upsells and order bumps
- **Affiliate Management** - Track and manage affiliate commissions
- **Advanced Analytics** - Real-time reporting and business intelligence dashboards

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payment Orchestration:** Spreedly
- **UI Components:** Radix UI + Tailwind CSS
- **Forms:** React Hook Form + Zod
- **State Management:** TanStack React Query
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Spreedly account (test environment for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd custom-crm
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Spreedly
SPREEDLY_ENVIRONMENT_KEY=your_environment_key
SPREEDLY_ACCESS_SECRET=your_access_secret
SPREEDLY_SIGNING_SECRET=your_signing_secret

# Demo Mode (optional - simulates payments without real gateway)
DEMO_MODE=true
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Implementation Guide](docs/spreedly/implementation-guide.md)** - Step-by-step implementation instructions
- **[Knowledgebase](docs/spreedly/knowledgebase.md)** - System architecture and module breakdowns

## Project Structure

```
custom-crm/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   │   ├── customers/    # Customer management endpoints
│   │   ├── orders/       # Order processing endpoints
│   │   └── webhooks/     # Webhook handlers (Spreedly)
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix)
│   ├── customers/        # Customer-specific components
│   └── orders/           # Order-specific components
├── lib/                   # Utilities and core logic
│   ├── supabase/         # Supabase client setup
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript types
│   ├── utils/            # Helper functions
│   └── config/           # Configuration files
├── hooks/                 # Custom React hooks
├── docs/                  # Documentation
└── supabase/             # Supabase migrations and seed data
```

## Development

### Running Tests

```bash
npm test                   # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:e2e          # Run end-to-end tests
```

### Type Checking

```bash
npm run type-check
```

### Building for Production

```bash
npm run build
npm start                 # Run production build locally
```

## Deployment

This application is designed to be deployed on Vercel with Supabase as the database.

### Environment Variables

Ensure all environment variables are configured in your Vercel project settings:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all variables from `.env.local`
4. Select all environments (Production, Preview, Development)

### Database Migrations

Deploy Supabase migrations before deploying the application:

```bash
# Using Supabase CLI
supabase db push
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## Support

For issues and questions:
- Create an issue in the repository
- Review the [Implementation Guide](docs/spreedly/implementation-guide.md)
- Check [Spreedly Documentation](https://docs.spreedly.com)

## License

Proprietary - All rights reserved
