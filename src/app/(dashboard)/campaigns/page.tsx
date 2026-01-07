import { createServiceClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/auth/organization-context'
import type { Campaign } from '@/types/database'
import { CampaignsClient } from './campaigns-client'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    type?: string
    category?: string
  }>
}

export default async function CampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { organization } = await getOrganizationContext()
  const supabase = await createServiceClient()

  // Build query with filters
  let query = supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.type && params.type !== 'all') {
    query = query.eq('campaign_type', params.type)
  }
  if (params.category && params.category !== 'none') {
    query = query.eq('category', params.category)
  }

  const { data: campaignsData } = await query
  const campaigns = (campaignsData || []) as Campaign[]

  // Get counts for each campaign
  const campaignIds = campaigns.map(c => c.id)

  // Get product counts
  const { data: productCounts } = await supabase
    .from('campaign_products')
    .select('campaign_id')
    .in('campaign_id', campaignIds)

  // Get offer counts
  const { data: offerCounts } = await supabase
    .from('campaign_offers')
    .select('campaign_id')
    .in('campaign_id', campaignIds)

  // Get upsell counts
  const { data: upsellCounts } = await supabase
    .from('campaign_upsells')
    .select('campaign_id')
    .in('campaign_id', campaignIds)

  // Create counts map
  type CountItem = { campaign_id: string }
  const productCountMap = ((productCounts || []) as CountItem[]).reduce((acc, item) => {
    acc[item.campaign_id] = (acc[item.campaign_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const offerCountMap = ((offerCounts || []) as CountItem[]).reduce((acc, item) => {
    acc[item.campaign_id] = (acc[item.campaign_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const upsellCountMap = ((upsellCounts || []) as CountItem[]).reduce((acc, item) => {
    acc[item.campaign_id] = (acc[item.campaign_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Enrich campaigns with counts
  const enrichedCampaigns = campaigns.map(campaign => ({
    ...campaign,
    productsCount: productCountMap[campaign.id] || 0,
    offersCount: offerCountMap[campaign.id] || 0,
    upsellsCount: upsellCountMap[campaign.id] || 0,
  }))

  return (
    <CampaignsClient
      campaigns={enrichedCampaigns}
      filters={params}
    />
  )
}
