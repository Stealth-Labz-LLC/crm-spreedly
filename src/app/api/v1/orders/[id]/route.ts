import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, apiSuccess, apiError } from '@/lib/api-auth'

/**
 * GET /api/v1/orders/:id
 * Get a specific order by ID
 */
export const GET = withApiAuth(async (request: NextRequest, apiKeyId: string, organizationId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return apiError('Order ID required', 400)
  }

  // Try to find by UUID first, then by order_number, then by display_id
  let query = supabase
    .from('orders')
    .select(`
      *,
      customers(id, email, first_name, last_name, phone, display_id),
      campaigns(id, name, display_id),
      campaign_offers(id, name, display_id, offer_type)
    `)
    .eq('organization_id', organizationId)

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isUUID) {
    query = query.eq('id', id)
  } else if (id.startsWith('ORD-')) {
    query = query.eq('order_number', id)
  } else {
    const displayId = parseInt(id)
    if (!isNaN(displayId)) {
      query = query.eq('display_id', displayId)
    } else {
      return apiError('Invalid order identifier', 400)
    }
  }

  const { data: order, error } = await query.single()

  if (error || !order) {
    return apiError('Order not found', 404)
  }

  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_id, name, sku, quantity, unit_price, total')
    .eq('order_id', order.id)

  // Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id, type, status, amount, currency,
      response_code, response_message, created_at,
      gateways(name)
    `)
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })

  // Get addresses
  const [{ data: billingAddr }, { data: shippingAddr }] = await Promise.all([
    order.billing_address_id
      ? supabase.from('customer_addresses').select('*').eq('id', order.billing_address_id).single()
      : Promise.resolve({ data: null }),
    order.shipping_address_id
      ? supabase.from('customer_addresses').select('*').eq('id', order.shipping_address_id).single()
      : Promise.resolve({ data: null }),
  ])

  return apiSuccess({
    order_id: order.id,
    order_number: order.order_number,
    display_id: order.display_id,
    customer: order.customers ? {
      id: order.customers.id,
      display_id: order.customers.display_id,
      email: order.customers.email,
      name: [order.customers.first_name, order.customers.last_name].filter(Boolean).join(' ') || null,
      phone: order.customers.phone,
    } : null,
    campaign: order.campaigns ? {
      id: order.campaigns.id,
      display_id: order.campaigns.display_id,
      name: order.campaigns.name,
    } : null,
    offer: order.campaign_offers ? {
      id: order.campaign_offers.id,
      display_id: order.campaign_offers.display_id,
      name: order.campaign_offers.name,
      type: order.campaign_offers.offer_type,
    } : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items?.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    })) || [],
    totals: {
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
    },
    billing_address: billingAddr ? {
      first_name: billingAddr.first_name,
      last_name: billingAddr.last_name,
      address_1: billingAddr.address_1,
      address_2: billingAddr.address_2,
      city: billingAddr.city,
      state: billingAddr.state,
      postal_code: billingAddr.postal_code,
      country: billingAddr.country,
      phone: billingAddr.phone,
    } : null,
    shipping_address: shippingAddr ? {
      first_name: shippingAddr.first_name,
      last_name: shippingAddr.last_name,
      address_1: shippingAddr.address_1,
      address_2: shippingAddr.address_2,
      city: shippingAddr.city,
      state: shippingAddr.state,
      postal_code: shippingAddr.postal_code,
      country: shippingAddr.country,
      phone: shippingAddr.phone,
    } : null,
    status: order.status,
    payment_status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transactions: transactions?.map((txn: any) => ({
      id: txn.id,
      type: txn.type,
      status: txn.status,
      amount: txn.amount,
      currency: txn.currency,
      gateway: (txn.gateways as { name: string } | null)?.name,
      response_code: txn.response_code,
      response_message: txn.response_message,
      created_at: txn.created_at,
    })) || [],
    notes: order.notes,
    metadata: order.metadata,
    created_at: order.created_at,
    updated_at: order.updated_at,
  })
})
