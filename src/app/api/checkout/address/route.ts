import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface AddressData {
  address_1: string
  address_2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

/**
 * POST /api/checkout/address
 * Updates customer with shipping/billing address and calculates pricing
 * Sets customer_status to 'partial'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_id,
      shipping_address,
      billing_address,
      bill_same_as_ship = true,
      shipping_option_id,
      coupon_code,
    } = body

    // Validate required fields
    if (!customer_id) {
      return NextResponse.json(
        { error: 'Missing customer_id' },
        { status: 400 }
      )
    }

    if (!shipping_address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    // Validate shipping address fields
    const requiredFields = ['address_1', 'city', 'state', 'postal_code', 'country']
    for (const field of requiredFields) {
      if (!shipping_address[field]) {
        return NextResponse.json(
          { error: `Shipping ${field.replace('_', ' ')} is required` },
          { status: 400 }
        )
      }
    }

    // Validate billing address if different
    if (!bill_same_as_ship && billing_address) {
      for (const field of requiredFields) {
        if (!billing_address[field]) {
          return NextResponse.json(
            { error: `Billing ${field.replace('_', ' ')} is required` },
            { status: 400 }
          )
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any

    // Fetch customer with campaign and offer data
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        campaign:campaigns(*),
        offer:campaign_offers(*, product:products(*))
      `)
      .eq('id', customer_id)
      .single()

    if (customerError || !customerData) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Type assertion for customer
    const customer = customerData as {
      id: string
      source_campaign_id: string
      source_offer_id: string
      customer_status: string
      email: string | null
      first_name: string | null
      last_name: string | null
      campaign: Record<string, unknown>
      offer: Record<string, unknown> & { product: Record<string, unknown> | null }
    }

    // Verify customer is not already fully converted
    if (customer.customer_status === 'customer') {
      return NextResponse.json(
        { error: 'This customer has already completed a purchase' },
        { status: 400 }
      )
    }

    const campaign = customer.campaign
    const offer = customer.offer
    const product = offer?.product

    // Calculate pricing
    const basePrice = (offer?.price_override as number) ?? (product?.price as number) ?? 0
    let discountAmount = 0

    // Apply offer discount
    const discountType = offer?.discount_type as string | null
    const discountValue = offer?.discount_value as number | null
    if (discountType && discountValue) {
      if (discountType === 'fixed') {
        discountAmount = discountValue
      } else if (discountType === 'percentage') {
        discountAmount = (basePrice * discountValue) / 100
      } else if (discountType === 'free') {
        discountAmount = basePrice
      }
    }

    // Apply coupon if provided
    let couponDiscount = 0
    if (coupon_code) {
      const { data: couponData } = await supabase
        .from('campaign_coupons')
        .select('*')
        .eq('campaign_id', customer.source_campaign_id)
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single()

      const coupon = couponData as {
        max_uses: number | null
        current_uses: number
        min_order_value: number | null
        discount_type: string
        discount_value: number
      } | null

      if (coupon) {
        // Check usage limits
        const canUseCoupon = !coupon.max_uses || coupon.current_uses < coupon.max_uses
        // Check min order value
        const meetsMinimum = !coupon.min_order_value || basePrice >= coupon.min_order_value

        if (canUseCoupon && meetsMinimum) {
          if (coupon.discount_type === 'fixed') {
            couponDiscount = coupon.discount_value
          } else if (coupon.discount_type === 'percentage') {
            couponDiscount = (basePrice * coupon.discount_value) / 100
          }
        }
      }
    }

    const subtotal = Math.max(0, basePrice - discountAmount - couponDiscount)

    // Get shipping cost
    let shippingCost = (offer?.ship_price as number) ?? (product?.shipping_cost as number) ?? 0

    if (shipping_option_id) {
      const { data: shippingOptionData } = await supabase
        .from('campaign_shipping_options')
        .select('*')
        .eq('id', shipping_option_id)
        .eq('campaign_id', customer.source_campaign_id)
        .single()

      const shippingOption = shippingOptionData as {
        base_cost: number
        free_threshold: number | null
      } | null

      if (shippingOption) {
        shippingCost = shippingOption.base_cost
        // Check for free shipping threshold
        if (shippingOption.free_threshold && subtotal >= shippingOption.free_threshold) {
          shippingCost = 0
        }
      }
    }

    // Calculate tax based on shipping address
    let taxAmount = 0
    const { data: taxRulesData } = await supabase
      .from('campaign_sales_tax')
      .select('*')
      .eq('campaign_id', customer.source_campaign_id)
      .eq('is_active', true)
      .eq('country_code', shipping_address.country)

    type TaxRule = { state_code: string | null; tax_rate: number }
    const taxRules = (taxRulesData || []) as TaxRule[]

    if (taxRules.length > 0) {
      // Find most specific tax rule (state-specific or country-wide)
      const stateTax = taxRules.find(
        (rule) => rule.state_code === shipping_address.state
      )
      const countryTax = taxRules.find((rule) => !rule.state_code)
      const applicableTax = stateTax || countryTax

      if (applicableTax) {
        // Tax is usually on subtotal, some jurisdictions include shipping
        const taxableAmount = subtotal
        taxAmount = (taxableAmount * applicableTax.tax_rate) / 100
      }
    }

    const total = subtotal + shippingCost + taxAmount

    // Update customer with address and pricing
    const shippingAddr = shipping_address as AddressData
    const billingAddr = (bill_same_as_ship ? shipping_address : billing_address) as AddressData

    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        customer_status: customer.customer_status === 'lead' ? 'partial' : customer.customer_status,
        ship_address_1: shippingAddr.address_1,
        ship_address_2: shippingAddr.address_2 || null,
        ship_city: shippingAddr.city,
        ship_state: shippingAddr.state,
        ship_postal_code: shippingAddr.postal_code,
        ship_country: shippingAddr.country,
        bill_same_as_ship,
        bill_address_1: billingAddr.address_1,
        bill_address_2: billingAddr.address_2 || null,
        bill_city: billingAddr.city,
        bill_state: billingAddr.state,
        bill_postal_code: billingAddr.postal_code,
        bill_country: billingAddr.country,
      })
      .eq('id', customer_id)
      .select()
      .single()

    if (updateError) {
      console.error('Customer update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      customer_id: updatedCustomer.id,
      status: updatedCustomer.customer_status,
      pricing: {
        base_price: basePrice,
        offer_discount: discountAmount,
        coupon_discount: couponDiscount,
        subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total,
        currency: (campaign?.currency as string) || 'USD',
      },
      // Store calculated totals for payment step
      checkout_totals: {
        subtotal,
        discount: discountAmount + couponDiscount,
        shipping: shippingCost,
        tax: taxAmount,
        total,
        shipping_option_id,
        coupon_code: coupon_code || null,
        coupon_discount: couponDiscount,
      },
    })
  } catch (error) {
    console.error('Address update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
