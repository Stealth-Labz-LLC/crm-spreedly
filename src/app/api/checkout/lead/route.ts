import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/checkout/lead
 * Creates or updates a customer with status='lead'
 * In the customer-centric model, a "lead" is just a customer at an early funnel stage
 *
 * Uses numeric IDs:
 * - campaign_id: The campaign's display_id (e.g., 1, 2)
 * - product_id: The offer's Campaign Product Id / display_id (e.g., 1, 2, 3)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      product_id, // Renamed from offer_id - uses Campaign Product Id (offer display_id)
      customer_id, // Optional - for updating existing customer
      email,
      first_name,
      last_name,
      phone,
      // UTM tracking
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      // Custom fields
      custom_fields,
    } = body

    // Validate required fields
    if (!campaign_id || !product_id) {
      return NextResponse.json(
        { error: 'Missing campaign_id or product_id' },
        { status: 400 }
      )
    }

    // Validate numeric IDs
    const campaignDisplayId = parseInt(campaign_id)
    const productDisplayId = parseInt(product_id)

    if (isNaN(campaignDisplayId) || isNaN(productDisplayId)) {
      return NextResponse.json(
        { error: 'campaign_id and product_id must be numeric' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any

    // Look up campaign UUID by display_id
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('display_id', campaignDisplayId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: `Campaign with ID ${campaignDisplayId} not found` },
        { status: 400 }
      )
    }

    // Look up offer UUID by display_id within the campaign
    const { data: offer, error: offerError } = await supabase
      .from('campaign_offers')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('display_id', productDisplayId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json(
        { error: `Product with ID ${productDisplayId} not found in campaign ${campaignDisplayId}` },
        { status: 400 }
      )
    }

    const campaignUuid = campaign.id
    const offerUuid = offer.id

    // Get IP and user agent from request
    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       'unknown'
    const user_agent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Generate a session ID if not provided
    const session_id = body.session_id || crypto.randomUUID()

    if (customer_id) {
      // Update existing customer
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .single()

      if (fetchError || !existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }

      // Update customer info
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          email,
          first_name: first_name || existingCustomer.first_name,
          last_name: last_name || existingCustomer.last_name,
          phone: phone || existingCustomer.phone,
          custom_fields: custom_fields || existingCustomer.custom_fields,
          // Only upgrade status if currently prospect
          customer_status: existingCustomer.customer_status === 'prospect' ? 'lead' : existingCustomer.customer_status,
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
        session_id,
      })
    }

    // Check if customer already exists by email
    const { data: existingCustomerByEmail } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    if (existingCustomerByEmail) {
      // Update existing customer with new source info if not already set
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: first_name || existingCustomerByEmail.first_name,
          last_name: last_name || existingCustomerByEmail.last_name,
          phone: phone || existingCustomerByEmail.phone,
          ip_address,
          user_agent,
          referrer,
          session_id,
          // Only set source if not already set
          source_campaign_id: existingCustomerByEmail.source_campaign_id || campaignUuid,
          source_offer_id: existingCustomerByEmail.source_offer_id || offerUuid,
          // Only set UTM if not already set
          utm_source: utm_source || existingCustomerByEmail.utm_source,
          utm_medium: utm_medium || existingCustomerByEmail.utm_medium,
          utm_campaign: utm_campaign || existingCustomerByEmail.utm_campaign,
          utm_content: utm_content || existingCustomerByEmail.utm_content,
          utm_term: utm_term || existingCustomerByEmail.utm_term,
          custom_fields: custom_fields || existingCustomerByEmail.custom_fields,
          // Only upgrade status if currently prospect
          customer_status: existingCustomerByEmail.customer_status === 'prospect' ? 'lead' : existingCustomerByEmail.customer_status,
        })
        .eq('id', existingCustomerByEmail.id)
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
        session_id,
        existing: true,
      })
    }

    // Create new customer with status='lead'
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        email,
        first_name,
        last_name,
        phone,
        customer_status: 'lead',
        source_campaign_id: campaignUuid,
        source_offer_id: offerUuid,
        ip_address,
        user_agent,
        referrer,
        session_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        custom_fields: custom_fields || {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Customer insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      customer_id: newCustomer.id,
      status: newCustomer.customer_status,
      session_id,
    })
  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/checkout/lead
 * Retrieve customer status by ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customer ID' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any

    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        campaign:campaigns(id, name),
        offer:campaign_offers(id, name, product:products(*))
      `)
      .eq('id', customerId)
      .single()

    if (error || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      customer,
    })
  } catch (error) {
    console.error('Customer fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
