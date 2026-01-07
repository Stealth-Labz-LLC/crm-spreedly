import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, apiSuccess, apiError } from '@/lib/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/customers/:id
 * Get a specific customer by ID or email
 */
export const GET = withApiAuth(async (request: NextRequest, apiKeyId: string, organizationId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return apiError('Customer ID required', 400)
  }

  // Try to find by UUID first, then by email
  let query = supabase
    .from('customers')
    .select(`
      id, display_id, email, first_name, last_name, phone,
      customer_status, source_campaign_id, source_offer_id,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      session_id, ip_address, user_agent, referrer,
      ship_address_1, ship_address_2, ship_city, ship_state, ship_postal_code, ship_country,
      bill_same_as_ship, bill_address_1, bill_address_2, bill_city, bill_state, bill_postal_code, bill_country,
      decline_count, last_decline_reason, last_decline_code,
      converted_at, first_order_id, lifetime_value, total_orders,
      custom_fields, created_at, updated_at
    `)
    .eq('organization_id', organizationId)

  // Check if id looks like UUID or email
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isUUID) {
    query = query.eq('id', id)
  } else if (id.includes('@')) {
    query = query.eq('email', id)
  } else {
    // Try display_id
    const displayId = parseInt(id)
    if (!isNaN(displayId)) {
      query = query.eq('display_id', displayId)
    } else {
      return apiError('Invalid customer identifier', 400)
    }
  }

  const { data: customer, error } = await query.single()

  if (error || !customer) {
    return apiError('Customer not found', 404)
  }

  // Get status history
  const { data: statusHistory } = await supabase
    .from('customer_status_history')
    .select('from_status, to_status, changed_by, reason, created_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, created_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return apiSuccess({
    customer_id: customer.id,
    display_id: customer.display_id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    status: customer.customer_status,
    source: {
      campaign_id: customer.source_campaign_id,
      offer_id: customer.source_offer_id
    },
    utm: {
      source: customer.utm_source,
      medium: customer.utm_medium,
      campaign: customer.utm_campaign,
      content: customer.utm_content,
      term: customer.utm_term
    },
    session: {
      session_id: customer.session_id,
      ip_address: customer.ip_address,
      user_agent: customer.user_agent,
      referrer: customer.referrer
    },
    shipping_address: {
      address_1: customer.ship_address_1,
      address_2: customer.ship_address_2,
      city: customer.ship_city,
      state: customer.ship_state,
      postal_code: customer.ship_postal_code,
      country: customer.ship_country
    },
    billing_address: customer.bill_same_as_ship ? null : {
      address_1: customer.bill_address_1,
      address_2: customer.bill_address_2,
      city: customer.bill_city,
      state: customer.bill_state,
      postal_code: customer.bill_postal_code,
      country: customer.bill_country
    },
    bill_same_as_ship: customer.bill_same_as_ship,
    decline_info: {
      count: customer.decline_count,
      last_reason: customer.last_decline_reason,
      last_code: customer.last_decline_code
    },
    conversion: {
      converted_at: customer.converted_at,
      first_order_id: customer.first_order_id
    },
    lifetime_value: customer.lifetime_value,
    total_orders: customer.total_orders,
    custom_fields: customer.custom_fields,
    status_history: statusHistory || [],
    recent_orders: orders || [],
    created_at: customer.created_at,
    updated_at: customer.updated_at
  })
})
