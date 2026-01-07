import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/checkout/validate
 * Validates campaign and offer for checkout
 *
 * Query params:
 * - c: Campaign ID (numeric display_id, e.g., 1, 2)
 * - o: Product ID (numeric offer display_id / Campaign Product Id, e.g., 1, 2, 3)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignIdParam = searchParams.get('c')
    const productIdParam = searchParams.get('o')

    if (!campaignIdParam || !productIdParam) {
      return NextResponse.json(
        { error: 'Missing campaign (c) or product (o) parameter' },
        { status: 400 }
      )
    }

    // Parse numeric IDs
    const campaignDisplayId = parseInt(campaignIdParam)
    const productDisplayId = parseInt(productIdParam)

    if (isNaN(campaignDisplayId) || isNaN(productDisplayId)) {
      return NextResponse.json(
        { error: 'Campaign (c) and product (o) must be numeric IDs' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any

    // Fetch campaign by display_id
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('display_id', campaignDisplayId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: `Campaign with ID ${campaignDisplayId} not found` },
        { status: 404 }
      )
    }

    // Check campaign is active
    if (campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Fetch offer by display_id within the campaign (product_id = offer display_id)
    const { data: offer, error: offerError } = await supabase
      .from('campaign_offers')
      .select(`
        *,
        product:products(*),
        billing_cycles:offer_billing_cycles(*)
      `)
      .eq('display_id', productDisplayId)
      .eq('campaign_id', campaign.id)
      .single()

    if (offerError || !offer) {
      return NextResponse.json(
        { error: `Product with ID ${productDisplayId} not found in campaign ${campaignDisplayId}` },
        { status: 404 }
      )
    }

    // Check offer is active
    if (!offer.is_active) {
      return NextResponse.json(
        { error: 'Offer is not active' },
        { status: 400 }
      )
    }

    // Fetch shipping options for the campaign
    const { data: shippingOptions } = await supabase
      .from('campaign_shipping_options')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    // Fetch sales tax rules
    const { data: salesTax } = await supabase
      .from('campaign_sales_tax')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('is_active', true)

    // Fetch active coupons
    const { data: coupons } = await supabase
      .from('campaign_coupons')
      .select('id, code, name, discount_type, discount_value')
      .eq('campaign_id', campaign.id)
      .eq('is_active', true)

    // Fetch custom fields
    const { data: customFields } = await supabase
      .from('campaign_custom_fields')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    // Fetch terms of service if required
    let termsOfService = null
    if (campaign.must_agree_tos) {
      const { data: tos } = await supabase
        .from('campaign_terms_of_service')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      termsOfService = tos
    }

    // Calculate initial pricing
    const product = offer.product
    const basePrice = offer.price_override ?? product?.price ?? 0
    const shipPrice = offer.ship_price ?? product?.shipping_cost ?? 0

    // Apply discount if any
    let discountAmount = 0
    if (offer.discount_type && offer.discount_value) {
      if (offer.discount_type === 'fixed') {
        discountAmount = offer.discount_value
      } else if (offer.discount_type === 'percentage') {
        discountAmount = (basePrice * offer.discount_value) / 100
      } else if (offer.discount_type === 'free') {
        discountAmount = basePrice
      }
    }

    const subtotal = Math.max(0, basePrice - discountAmount)

    return NextResponse.json({
      valid: true,
      campaign: {
        id: campaign.id,
        campaign_id: campaign.display_id, // Numeric campaign ID
        name: campaign.name,
        description: campaign.description,
        currency: campaign.currency,
        must_agree_tos: campaign.must_agree_tos,
        preauth_only: campaign.preauth_only,
      },
      offer: {
        id: offer.id,
        product_id: offer.display_id, // Numeric product ID (Campaign Product Id)
        name: offer.name,
        description: offer.description,
        offer_type: offer.offer_type,
        billing_type: offer.billing_type,
        trial_enabled: offer.trial_enabled,
        trial_type: offer.trial_type,
        trial_days: offer.trial_days,
        trial_price: offer.trial_price,
        billing_cycles: offer.billing_cycles,
      },
      product: product ? {
        id: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        image_url: product.metadata?.image_url || null,
      } : null,
      pricing: {
        base_price: basePrice,
        discount_amount: discountAmount,
        discount_type: offer.discount_type,
        subtotal,
        shipping: shipPrice,
        tax: 0, // Calculated after address is entered
        total: subtotal + shipPrice,
        currency: campaign.currency,
      },
      shipping_options: shippingOptions || [],
      sales_tax_rules: salesTax || [],
      custom_fields: customFields || [],
      terms_of_service: termsOfService,
      has_coupons: (coupons || []).length > 0,
    })
  } catch (error) {
    console.error('Checkout validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
