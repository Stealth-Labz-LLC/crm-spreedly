import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, apiSuccess, apiError } from '@/lib/api-auth'
import { z } from 'zod'

const orderItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string(),
  sku: z.string().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
})

const addressSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  address_1: z.string(),
  address_2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string().default('US'),
  phone: z.string().optional(),
})

const orderSchema = z.object({
  // Customer identification (one of these required)
  customer_id: z.string().uuid().optional(),
  customer_email: z.string().email().optional(),

  // Attribution
  campaign_id: z.string().uuid().optional(),
  offer_id: z.string().uuid().optional(),

  // Order items
  items: z.array(orderItemSchema).min(1),

  // Pricing
  subtotal: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  currency: z.string().default('USD'),

  // Addresses
  shipping_address: addressSchema.optional(),
  billing_address: addressSchema.optional(),
  bill_same_as_ship: z.boolean().default(true),

  // Status
  status: z.enum(['pending', 'processing', 'completed', 'paid', 'cancelled', 'refunded']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']).optional(),
  fulfillment_status: z.enum(['unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered']).optional(),

  // Payment info
  gateway_id: z.string().uuid().optional(),
  payment_token: z.string().optional(),
  payment_method_id: z.string().uuid().optional(),

  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/v1/orders
 * Create a new order
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

  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400)
  }

  const data = parsed.data

  // Validate customer exists or get by email
  let customerId = data.customer_id

  if (!customerId && data.customer_email) {
    // Find or create customer by email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', data.customer_email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      // Create customer
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          email: data.customer_email,
          customer_status: 'customer',
          source_campaign_id: data.campaign_id,
          source_offer_id: data.offer_id,
        })
        .select('id')
        .single()

      if (custError) {
        return apiError(`Failed to create customer: ${custError.message}`, 500)
      }
      customerId = newCustomer.id
    }
  }

  if (!customerId) {
    return apiError('Either customer_id or customer_email is required', 400)
  }

  // Create addresses if provided
  let billingAddressId: string | null = null
  let shippingAddressId: string | null = null

  if (data.shipping_address) {
    const { data: shipAddr, error: shipError } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customerId,
        address_type: 'shipping',
        first_name: data.shipping_address.first_name,
        last_name: data.shipping_address.last_name,
        address_1: data.shipping_address.address_1,
        address_2: data.shipping_address.address_2,
        city: data.shipping_address.city,
        state: data.shipping_address.state,
        postal_code: data.shipping_address.postal_code,
        country: data.shipping_address.country,
        phone: data.shipping_address.phone,
      })
      .select('id')
      .single()

    if (shipError) {
      return apiError(`Failed to create shipping address: ${shipError.message}`, 500)
    }
    shippingAddressId = shipAddr.id
  }

  if (data.billing_address && !data.bill_same_as_ship) {
    const { data: billAddr, error: billError } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customerId,
        address_type: 'billing',
        first_name: data.billing_address.first_name,
        last_name: data.billing_address.last_name,
        address_1: data.billing_address.address_1,
        address_2: data.billing_address.address_2,
        city: data.billing_address.city,
        state: data.billing_address.state,
        postal_code: data.billing_address.postal_code,
        country: data.billing_address.country,
        phone: data.billing_address.phone,
      })
      .select('id')
      .single()

    if (billError) {
      return apiError(`Failed to create billing address: ${billError.message}`, 500)
    }
    billingAddressId = billAddr.id
  } else if (data.bill_same_as_ship && shippingAddressId) {
    billingAddressId = shippingAddressId
  }

  // Calculate subtotal if not provided
  const calculatedSubtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      campaign_id: data.campaign_id,
      offer_id: data.offer_id,
      billing_address_id: billingAddressId,
      shipping_address_id: shippingAddressId,
      subtotal: data.subtotal ?? calculatedSubtotal,
      discount: data.discount ?? 0,
      shipping: data.shipping ?? 0,
      tax: data.tax ?? 0,
      total: data.total,
      currency: data.currency,
      status: data.status ?? 'pending',
      payment_status: data.payment_status ?? 'pending',
      fulfillment_status: data.fulfillment_status ?? 'unfulfilled',
      notes: data.notes,
      metadata: data.metadata,
    })
    .select('id, order_number, display_id')
    .single()

  if (orderError) {
    return apiError(`Failed to create order: ${orderError.message}`, 500)
  }

  // Create order items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    return apiError(`Failed to create order items: ${itemsError.message}`, 500)
  }

  // Update customer stats
  await supabase.rpc('update_customer_stats', { p_customer_id: customerId })
    .then(() => {})
    .catch(() => {
      // Stats update is non-critical, log but don't fail
    })

  // Update customer status if this is their first order
  const { data: customerData } = await supabase
    .from('customers')
    .select('total_orders, first_order_id')
    .eq('id', customerId)
    .single()

  if (customerData && !customerData.first_order_id) {
    await supabase
      .from('customers')
      .update({
        customer_status: data.payment_status === 'paid' ? 'customer' : 'partial',
        first_order_id: order.id,
        converted_at: data.payment_status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', customerId)
  }

  return apiSuccess({
    order_id: order.id,
    order_number: order.order_number,
    display_id: order.display_id,
    customer_id: customerId,
  }, 201)
})

/**
 * GET /api/v1/orders
 * List orders with optional filters
 */
export const GET = withApiAuth(async (request: NextRequest) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { searchParams } = new URL(request.url)

  const customer_id = searchParams.get('customer_id')
  const customer_email = searchParams.get('customer_email')
  const campaign_id = searchParams.get('campaign_id')
  const offer_id = searchParams.get('offer_id')
  const status = searchParams.get('status')
  const payment_status = searchParams.get('payment_status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, display_id, customer_id,
      campaign_id, offer_id,
      subtotal, discount, shipping, tax, total, currency,
      status, payment_status, fulfillment_status,
      created_at, updated_at,
      customers!inner(id, email, first_name, last_name)
    `, { count: 'exact' })

  // Apply filters
  if (customer_id) {
    query = query.eq('customer_id', customer_id)
  }
  if (customer_email) {
    query = query.eq('customers.email', customer_email)
  }
  if (campaign_id) {
    query = query.eq('campaign_id', campaign_id)
  }
  if (offer_id) {
    query = query.eq('offer_id', offer_id)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (payment_status) {
    query = query.eq('payment_status', payment_status)
  }

  // Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: orders, error, count } = await query

  if (error) {
    return apiError(error.message, 500)
  }

  return apiSuccess({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders: orders?.map((o: any) => ({
      order_id: o.id,
      order_number: o.order_number,
      display_id: o.display_id,
      customer: {
        id: o.customers?.id,
        email: o.customers?.email,
        name: [o.customers?.first_name, o.customers?.last_name].filter(Boolean).join(' ') || null,
      },
      campaign_id: o.campaign_id,
      offer_id: o.offer_id,
      totals: {
        subtotal: o.subtotal,
        discount: o.discount,
        shipping: o.shipping,
        tax: o.tax,
        total: o.total,
        currency: o.currency,
      },
      status: o.status,
      payment_status: o.payment_status,
      fulfillment_status: o.fulfillment_status,
      created_at: o.created_at,
      updated_at: o.updated_at,
    })) || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    }
  })
})
