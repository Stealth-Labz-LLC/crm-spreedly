import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSpreedlyClient } from '@/lib/spreedly/client'

// Check if demo mode is enabled
const isDemoMode = process.env.DEMO_MODE === 'true'

/**
 * POST /api/checkout/payment
 * Process payment for a customer
 * Creates order and updates customer status to 'customer' on success
 * Updates customer status to 'declined' on failure
 *
 * In DEMO_MODE, payments are simulated without calling a real gateway
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_id,
      payment_method_token, // Spreedly payment method token from frontend
      card_type,
      card_last_four,
      card_exp_month,
      card_exp_year,
      // Checkout totals from address step
      checkout_totals,
    } = body

    // Validate required fields
    if (!customer_id) {
      return NextResponse.json(
        { error: 'Missing customer_id' },
        { status: 400 }
      )
    }

    if (!payment_method_token) {
      return NextResponse.json(
        { error: 'Payment method token is required' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any
    const spreedly = getSpreedlyClient()

    // Fetch customer with all related data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        campaign:campaigns(*),
        offer:campaign_offers(*, product:products(*), gateway:gateways(*))
      `)
      .eq('id', customer_id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify customer is ready for payment
    if (customer.customer_status === 'customer') {
      return NextResponse.json(
        { error: 'This customer has already completed a purchase' },
        { status: 400 }
      )
    }

    if (customer.customer_status !== 'partial' && customer.customer_status !== 'declined') {
      return NextResponse.json(
        { error: 'Please complete all checkout steps before payment' },
        { status: 400 }
      )
    }

    const campaign = customer.campaign
    const offer = customer.offer
    const product = offer?.product
    let gateway = offer?.gateway as Record<string, unknown> | null

    // If no gateway on offer, get the highest priority active gateway
    if (!gateway) {
      const { data: defaultGateway } = await supabase
        .from('gateways')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single()

      if (!defaultGateway) {
        return NextResponse.json(
          { error: 'No payment gateway configured' },
          { status: 500 }
        )
      }

      gateway = defaultGateway
    }

    // Calculate totals (use passed totals or recalculate)
    const totals = checkout_totals || {
      subtotal: (offer?.price_override as number) ?? (product?.price as number) ?? 0,
      discount: 0,
      shipping: (offer?.ship_price as number) ?? (product?.shipping_cost as number) ?? 0,
      tax: 0,
      total: 0,
    }

    if (!totals.total) {
      totals.total = totals.subtotal - totals.discount + totals.shipping + totals.tax
    }

    // Prepare transaction
    const amount = Math.round(totals.total * 100) // Convert to cents
    const currency = (campaign?.currency as string) || 'USD'
    const preauthOnly = campaign?.preauth_only as boolean

    // Demo mode transaction token
    const demoTransactionToken = `demo_txn_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // ============ DEMO MODE PAYMENT SIMULATION ============
    if (isDemoMode) {
      console.log('🔧 DEMO MODE: Simulating payment for', totals.total, currency)

      // Simulate decline for specific test card numbers
      const isTestDecline = card_last_four === '0002' || card_last_four === '9999'

      if (isTestDecline) {
        // Simulate declined payment
        await supabase
          .from('customers')
          .update({
            customer_status: 'declined',
            decline_count: (customer.decline_count || 0) + 1,
            last_decline_reason: 'DEMO: Card declined (test decline card)',
            last_decline_code: 'DEMO_DECLINE',
          })
          .eq('id', customer_id)

        // Create demo declined transaction (gateway may be null in demo mode)
        await supabase.from('transactions').insert({
          customer_id,
          gateway_id: gateway?.id as string || null,
          spreedly_transaction_token: demoTransactionToken,
          type: preauthOnly ? 'authorize' : 'purchase',
          status: 'declined',
          amount: totals.total,
          currency,
          response_code: 'DEMO_DECLINE',
          response_message: 'DEMO: Test decline - use card ending in 1111 for success',
          metadata: { customer_id, demo_mode: true },
        })

        return NextResponse.json({
          success: false,
          status: 'declined',
          customer_id,
          error: 'DEMO: Card declined. Use test card 4111 1111 1111 1111 for success.',
          response_code: 'DEMO_DECLINE',
        })
      }

      // Demo mode succeeds - skip to order creation below
      console.log('🔧 DEMO MODE: Payment approved, creating order...')
    } else {
      // ============ REAL SPREEDLY PAYMENT ============
      // Process payment through Spreedly
      if (!gateway) {
        return NextResponse.json(
          { error: 'No payment gateway available' },
          { status: 500 }
        )
      }

      const spreedly = getSpreedlyClient()
      const gatewayToken = gateway.spreedly_gateway_token as string
      const transactionRequest = {
        amount,
        currency_code: currency,
        payment_method_token,
        order_id: `CUST-${customer.display_id}`,
        description: `Order for ${offer?.name || 'Offer'}`,
        email: customer.email || undefined,
        ip: customer.ip_address || undefined,
        retain_on_success: true,
        stored_credential_initiator: 'cardholder' as const,
        stored_credential_usage: 'first' as const,
      }

      let paymentResult
      if (preauthOnly) {
        paymentResult = await spreedly.authorize(gatewayToken, transactionRequest)
      } else {
        paymentResult = await spreedly.purchase(gatewayToken, transactionRequest)
      }

      // Handle payment result
      if (!paymentResult.success || !paymentResult.data) {
        // Payment failed - update customer as declined
        await supabase
          .from('customers')
          .update({
            customer_status: 'declined',
            decline_count: (customer.decline_count || 0) + 1,
            last_decline_reason: paymentResult.error || 'Payment declined',
            last_decline_code: 'SPREEDLY_ERROR',
          })
          .eq('id', customer_id)

        // Create failed transaction record
        await supabase.from('transactions').insert({
          customer_id,
          gateway_id: gateway.id as string,
          type: preauthOnly ? 'authorize' : 'purchase',
          status: 'declined',
          amount: totals.total,
          currency,
          error_code: 'SPREEDLY_ERROR',
          error_detail: paymentResult.error,
          metadata: { customer_id },
        })

        return NextResponse.json({
          success: false,
          status: 'declined',
          customer_id,
          error: paymentResult.error || 'Payment was declined',
        })
      }

      const transaction = paymentResult.data.transaction as Record<string, unknown>
      const transactionSucceeded = transaction.succeeded as boolean

      if (!transactionSucceeded) {
        // Gateway declined the transaction
        const declineMessage = (transaction.message as string) || 'Payment declined by processor'
        const responseCode = (transaction.response as { error_code?: string })?.error_code || 'DECLINED'

        await supabase
          .from('customers')
          .update({
            customer_status: 'declined',
            decline_count: (customer.decline_count || 0) + 1,
            last_decline_reason: declineMessage,
            last_decline_code: responseCode,
          })
          .eq('id', customer_id)

        // Create declined transaction record
        await supabase.from('transactions').insert({
          customer_id,
          gateway_id: gateway.id as string,
          spreedly_transaction_token: transaction.token as string,
          type: preauthOnly ? 'authorize' : 'purchase',
          status: 'declined',
          amount: totals.total,
          currency,
          response_code: responseCode,
          response_message: declineMessage,
          avs_result: transaction.avs_code as string,
          cvv_result: transaction.cvv_code as string,
          metadata: { customer_id },
        })

        return NextResponse.json({
          success: false,
          status: 'declined',
          customer_id,
          error: declineMessage,
          response_code: responseCode,
        })
      }
    }

    // Payment succeeded - Create order and update customer

    // 1. Create shipping address
    const { data: shippingAddress } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id,
        address_type: 'shipping',
        is_default: true,
        first_name: customer.first_name,
        last_name: customer.last_name,
        address_1: customer.ship_address_1,
        address_2: customer.ship_address_2,
        city: customer.ship_city,
        state: customer.ship_state,
        postal_code: customer.ship_postal_code,
        country: customer.ship_country,
        phone: customer.phone,
      })
      .select()
      .single()

    // 2. Create billing address (if different)
    let billingAddressId = shippingAddress?.id
    if (!customer.bill_same_as_ship) {
      const { data: billingAddress } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id,
          address_type: 'billing',
          is_default: true,
          first_name: customer.first_name,
          last_name: customer.last_name,
          address_1: customer.bill_address_1,
          address_2: customer.bill_address_2,
          city: customer.bill_city,
          state: customer.bill_state,
          postal_code: customer.bill_postal_code,
          country: customer.bill_country,
          phone: customer.phone,
        })
        .select()
        .single()

      if (billingAddress) {
        billingAddressId = billingAddress.id
      }
    }

    // 3. Store payment method
    const { data: paymentMethod } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id,
        spreedly_token: payment_method_token,
        card_type,
        last_four: card_last_four,
        exp_month: card_exp_month,
        exp_year: card_exp_year,
        is_default: true,
        is_active: true,
      })
      .select()
      .single()

    // 4. Generate order number
    const { data: orderCountData } = await supabase
      .from('orders')
      .select('display_id')
      .order('display_id', { ascending: false })
      .limit(1)
      .single()

    const nextDisplayId = (orderCountData?.display_id || 1000) + 1
    const orderNumber = `ORD-${String(nextDisplayId).padStart(8, '0')}`

    // 5. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id,
        campaign_id: customer.source_campaign_id,
        offer_id: customer.source_offer_id,
        status: 'processing',
        payment_status: preauthOnly ? 'authorized' : 'paid',
        fulfillment_status: 'unfulfilled',
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total,
        currency,
        billing_address_id: billingAddressId,
        shipping_address_id: shippingAddress?.id,
        ip_address: customer.ip_address,
        metadata: {
          utm_source: customer.utm_source,
          utm_medium: customer.utm_medium,
          utm_campaign: customer.utm_campaign,
          custom_fields: customer.custom_fields,
        },
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // 6. Create order item
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product?.id as string || null,
      name: (product?.name as string) || (offer?.name as string) || 'Product',
      sku: (product?.sku as string) || null,
      quantity: (offer?.qty_per_order as number) || 1,
      unit_price: totals.subtotal,
      total: totals.subtotal,
      metadata: {
        offer_id: customer.source_offer_id,
        offer_name: offer?.name,
      },
    })

    // 7. Create successful transaction record
    await supabase.from('transactions').insert({
      order_id: order.id,
      customer_id,
      gateway_id: gateway?.id as string || null,
      payment_method_id: paymentMethod?.id,
      spreedly_transaction_token: isDemoMode ? demoTransactionToken : null,
      type: preauthOnly ? 'authorize' : 'purchase',
      status: 'succeeded',
      amount: totals.total,
      currency,
      response_code: isDemoMode ? 'DEMO_APPROVED' : null,
      response_message: isDemoMode ? 'DEMO: Payment approved' : null,
      avs_result: isDemoMode ? 'Y' : null,
      cvv_result: isDemoMode ? 'M' : null,
      metadata: {
        customer_id,
        demo_mode: isDemoMode,
      },
    })

    // 8. Update customer to 'customer' status
    await supabase
      .from('customers')
      .update({
        customer_status: 'customer',
        first_order_id: order.id,
        converted_at: new Date().toISOString(),
        lifetime_value: totals.total,
        total_orders: 1,
      })
      .eq('id', customer_id)

    // 9. Update campaign analytics (increment orders)
    const today = new Date().toISOString().split('T')[0]
    const { data: existingAnalytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', customer.source_campaign_id)
      .eq('metric_date', today)
      .single()

    if (existingAnalytics) {
      await supabase
        .from('campaign_analytics')
        .update({
          orders_count: existingAnalytics.orders_count + 1,
          orders_value: existingAnalytics.orders_value + totals.total,
        })
        .eq('id', existingAnalytics.id)
    } else {
      await supabase.from('campaign_analytics').insert({
        campaign_id: customer.source_campaign_id,
        metric_date: today,
        orders_count: 1,
        orders_value: totals.total,
      })
    }

    return NextResponse.json({
      success: true,
      status: 'paid',
      customer_id,
      order_id: order.id,
      order_number: order.order_number,
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error during payment processing' },
      { status: 500 }
    )
  }
}
