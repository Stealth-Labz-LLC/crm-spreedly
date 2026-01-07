import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { Campaign, CampaignAnalytics } from '@/types/database'
import { CampaignAnalyticsDashboard } from './analytics-dashboard'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignAnalyticsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    notFound()
  }

  // Get analytics data for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: analytics } = await supabase
    .from('campaign_analytics')
    .select('*')
    .eq('campaign_id', id)
    .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('metric_date', { ascending: true })

  // Get total orders linked to this campaign
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', id)

  // Calculate totals
  const analyticsData = (analytics || []) as CampaignAnalytics[]
  const totals = analyticsData.reduce(
    (acc, day) => ({
      impressions: acc.impressions + (day.impressions || 0),
      clicks: acc.clicks + (day.clicks || 0),
      orders_count: acc.orders_count + (day.orders_count || 0),
      orders_value: acc.orders_value + (day.orders_value || 0),
      refunds_count: acc.refunds_count + (day.refunds_count || 0),
      refunds_value: acc.refunds_value + (day.refunds_value || 0),
    }),
    { impressions: 0, clicks: 0, orders_count: 0, orders_value: 0, refunds_count: 0, refunds_value: 0 }
  )

  const conversionRate = totals.clicks > 0 ? (totals.orders_count / totals.clicks) * 100 : 0
  const avgOrderValue = totals.orders_count > 0 ? totals.orders_value / totals.orders_count : 0

  return (
    <CampaignAnalyticsDashboard
      campaign={campaign as Campaign}
      analytics={analyticsData}
      totals={{
        ...totals,
        conversionRate,
        avgOrderValue,
        totalOrders: ordersCount || 0,
      }}
    />
  )
}
