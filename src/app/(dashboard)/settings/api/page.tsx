import { createServiceClient } from '@/lib/supabase/server'
import { ApiSettingsClient } from './client'
import type { ApiSettings, ApiRequestLog, ConnectedDomain } from '@/types/database'

export default async function ApiSettingsPage() {
  const supabase = await createServiceClient()

  // Get API settings
  const { data: apiSettingsData } = await supabase
    .from('api_settings')
    .select('*')
    .order('created_at', { ascending: false })

  // Get recent API requests
  const { data: recentRequestsData } = await supabase
    .from('api_request_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get connected domains
  const { data: connectedDomainsData } = await supabase
    .from('connected_domains')
    .select(`
      *,
      campaigns(id, name, display_id)
    `)
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
