import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, apiSuccess, apiError } from '@/lib/api-auth'
import { z } from 'zod'

// Schema for customer creation/update
// Uses numeric IDs: campaign_id (campaign display_id), product_id (offer display_id)
const customerSchema = z.object({
  // Required
  email: z.string().email(),

  // Optional contact info
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),

  // Status
  customer_status: z.enum(['prospect', 'lead', 'partial', 'customer', 'declined', 'cancelled', 'refunded']).optional(),

  // Source tracking - using numeric IDs
  campaign_id: z.number().int().positive().optional(),
  product_id: z.number().int().positive().optional(), // Campaign Product Id (offer display_id)

  // UTM tracking
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),

  // Session tracking
  session_id: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  referrer: z.string().optional(),

  // Shipping address
  ship_address_1: z.string().optional(),
  ship_address_2: z.string().optional(),
  ship_city: z.string().optional(),
  ship_state: z.string().optional(),
  ship_postal_code: z.string().optional(),
  ship_country: z.string().optional(),

  // Billing address
  bill_same_as_ship: z.boolean().optional(),
  bill_address_1: z.string().optional(),
  bill_address_2: z.string().optional(),
  bill_city: z.string().optional(),
  bill_state: z.string().optional(),
  bill_postal_code: z.string().optional(),
  bill_country: z.string().optional(),

  // Custom fields
  custom_fields: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/v1/customers
 * Create or update a customer (upsert by email)
 *
 * Uses numeric IDs:
 * - campaign_id: The campaign's display_id (e.g., 1, 2)
 * - product_id: The offer's Campaign Product Id / display_id (e.g., 1, 2, 3)
 */
export const POST = withApiAuth(async (request: NextRequest) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = customerSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400)
  }

  const data = parsed.data

  // Look up campaign UUID by display_id if provided
  let campaignUuid: string | null = null
  if (data.campaign_id) {
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('display_id', data.campaign_id)
      .single()

    if (campaignError || !campaign) {
      return apiError(`Campaign with ID ${data.campaign_id} not found`, 400)
    }
    campaignUuid = campaign.id
  }

  // Look up offer UUID by display_id within the campaign if provided
  let offerUuid: string | null = null
  if (data.product_id) {
    if (!campaignUuid) {
      return apiError('campaign_id is required when product_id is provided', 400)
    }

    const { data: offer, error: offerError } = await supabase
      .from('campaign_offers')
      .select('id')
      .eq('campaign_id', campaignUuid)
      .eq('display_id', data.product_id)
      .single()

    if (offerError || !offer) {
      return apiError(`Product with ID ${data.product_id} not found in campaign ${data.campaign_id}`, 400)
    }
    offerUuid = offer.id
  }

  // Check if customer exists by email
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, customer_status')
    .eq('email', data.email)
    .single()

  const customerData: Record<string, unknown> = {
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone,
    customer_status: data.customer_status,
    source_campaign_id: campaignUuid,
    source_offer_id: offerUuid,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_content: data.utm_content,
    utm_term: data.utm_term,
    session_id: data.session_id,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    referrer: data.referrer,
    ship_address_1: data.ship_address_1,
    ship_address_2: data.ship_address_2,
    ship_city: data.ship_city,
    ship_state: data.ship_state,
    ship_postal_code: data.ship_postal_code,
    ship_country: data.ship_country,
    bill_same_as_ship: data.bill_same_as_ship,
    bill_address_1: data.bill_address_1,
    bill_address_2: data.bill_address_2,
    bill_city: data.bill_city,
    bill_state: data.bill_state,
    bill_postal_code: data.bill_postal_code,
    bill_country: data.bill_country,
    custom_fields: data.custom_fields,
  }

  // Remove undefined values
  Object.keys(customerData).forEach(key => {
    if (customerData[key] === undefined) {
      delete customerData[key]
    }
  })

  if (existingCustomer) {
    // Update existing customer
    const { data: customer, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', existingCustomer.id)
      .select('id, display_id, email, first_name, last_name, customer_status')
      .single()

    if (error) {
      return apiError(error.message, 500)
    }

    return apiSuccess({
      customer_id: customer.id,
      display_id: customer.display_id,
      email: customer.email,
      name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null,
      status: customer.customer_status,
      action: 'updated'
    })
  } else {
    // Create new customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select('id, display_id, email, first_name, last_name, customer_status')
      .single()

    if (error) {
      return apiError(error.message, 500)
    }

    return apiSuccess({
      customer_id: customer.id,
      display_id: customer.display_id,
      email: customer.email,
      name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null,
      status: customer.customer_status,
      action: 'created'
    }, 201)
  }
})

/**
 * GET /api/v1/customers
 * List customers with optional filters
 *
 * Query params:
 * - campaign_id: Filter by campaign display_id (numeric)
 * - product_id: Filter by offer display_id (numeric, requires campaign_id)
 */
export const GET = withApiAuth(async (request: NextRequest) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { searchParams } = new URL(request.url)

  const email = searchParams.get('email')
  const status = searchParams.get('status')
  const campaignIdParam = searchParams.get('campaign_id')
  const productIdParam = searchParams.get('product_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = (page - 1) * limit

  // Look up campaign UUID if numeric ID provided
  let campaignUuid: string | null = null
  if (campaignIdParam) {
    const campaignDisplayId = parseInt(campaignIdParam)
    if (!isNaN(campaignDisplayId)) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('display_id', campaignDisplayId)
        .single()
      if (campaign) {
        campaignUuid = campaign.id
      }
    }
  }

  // Look up offer UUID if numeric ID provided
  let offerUuid: string | null = null
  if (productIdParam && campaignUuid) {
    const productDisplayId = parseInt(productIdParam)
    if (!isNaN(productDisplayId)) {
      const { data: offer } = await supabase
        .from('campaign_offers')
        .select('id')
        .eq('campaign_id', campaignUuid)
        .eq('display_id', productDisplayId)
        .single()
      if (offer) {
        offerUuid = offer.id
      }
    }
  }

  let query = supabase
    .from('customers')
    .select(`
      id, display_id, email, first_name, last_name, phone,
      customer_status, source_campaign_id, source_offer_id,
      utm_source, utm_medium, utm_campaign,
      lifetime_value, total_orders, converted_at, created_at,
      campaigns:source_campaign_id(display_id),
      offers:source_offer_id(display_id)
    `, { count: 'exact' })

  // Apply filters
  if (email) {
    query = query.eq('email', email)
  }
  if (status) {
    query = query.eq('customer_status', status)
  }
  if (campaignUuid) {
    query = query.eq('source_campaign_id', campaignUuid)
  }
  if (offerUuid) {
    query = query.eq('source_offer_id', offerUuid)
  }

  // Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: customers, error, count } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers: customers.map((c: any) => ({
      customer_id: c.id,
      display_id: c.display_id,
      email: c.email,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || null,
      phone: c.phone,
      status: c.customer_status,
      campaign_id: c.campaigns?.display_id || null,
      product_id: c.offers?.display_id || null,
      utm: {
        source: c.utm_source,
        medium: c.utm_medium,
        campaign: c.utm_campaign
      },
      lifetime_value: c.lifetime_value,
      total_orders: c.total_orders,
      converted_at: c.converted_at,
      created_at: c.created_at
    })),
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    }
  })
})
