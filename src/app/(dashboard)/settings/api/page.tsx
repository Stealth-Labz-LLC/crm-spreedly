import { createServiceClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/auth/organization-context'
import { ApiSettingsClient } from './client'
import type { ApiSettings, ApiRequestLog, ConnectedDomain } from '@/types/database'

export default async function ApiSettingsPage() {
  const { organization } = await getOrganizationContext()
  const supabase = await createServiceClient()

  // Get API settings for this organization
  const { data: apiSettingsData } = await supabase
    .from('api_settings')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  // Get API key IDs for this organization
  const apiKeyIds = (apiSettingsData || []).map((s: { id: string }) => s.id)

  // Get recent API requests for this organization's API keys
  const { data: recentRequestsData } = apiKeyIds.length > 0
    ? await supabase
        .from('api_request_log')
        .select('*')
        .in('api_key_id', apiKeyIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  // Get connected domains for this organization
  const { data: connectedDomainsData } = await supabase
    .from('connected_domains')
    .select(`
      *,
      campaigns(id, name, display_id)
    `)
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  // Get API usage stats
  const { data: usageStats } = await supabase
    .from('api_usage_summary')
    .select('*')
    .limit(7)

  const apiSettings = (apiSettingsData || []) as ApiSettings[]
  const recentRequests = (recentRequestsData || []) as ApiRequestLog[]
  const connectedDomains = (connectedDomainsData || []) as (ConnectedDomain & {
    campaigns: { id: string; name: string; display_id: number } | null
  })[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
        <p className="text-muted-foreground">
          Manage your API keys for external funnel integrations
        </p>
      </div>

      <ApiSettingsClient
        apiSettings={apiSettings}
        recentRequests={recentRequests}
        connectedDomains={connectedDomains}
        usageStats={usageStats || []}
      />
    </div>
  )
}
