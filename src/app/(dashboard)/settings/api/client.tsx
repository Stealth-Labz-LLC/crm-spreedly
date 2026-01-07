'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ApiSettings, ApiRequestLog, ConnectedDomain } from '@/types/database'

interface ApiSettingsClientProps {
  apiSettings: ApiSettings[]
  recentRequests: ApiRequestLog[]
  connectedDomains: (ConnectedDomain & {
    campaigns: { id: string; name: string; display_id: number } | null
  })[]
  usageStats: { date: string; total_requests: number; successful: number; failed: number }[]
}

export function ApiSettingsClient({
  apiSettings,
  recentRequests,
  connectedDomains,
  usageStats,
}: ApiSettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const toggleKeyVisibility = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSecretVisibility = (id: string) => {
    setShowSecret(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const createNewApiKey = async () => {
    setIsCreating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('api_settings')
        .insert({
          name: newKeyName || 'New API Key',
          description: 'API key for external integrations',
        })

      if (error) throw error

      toast.success('New API key created')
      setNewKeyName('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to create API key')
    } finally {
      setIsCreating(false)
    }
  }

  const regenerateApiKey = async (id: string) => {
    try {
      // Generate new key using database function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('regenerate_api_key', { key_id: id })

      if (error) {
        // If RPC doesn't exist, update manually (this is a fallback)
        const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('api_settings')
          .update({ api_key: newKey })
          .eq('id', id)
      }

      toast.success('API key regenerated')
      router.refresh()
    } catch (error) {
      toast.error('Failed to regenerate API key')
    }
  }

  const toggleApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('api_settings')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(currentStatus ? 'API key deactivated' : 'API key activated')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update API key')
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('api_settings').delete().eq('id', id)
      if (error) throw error

      toast.success('API key deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Use these keys to authenticate external requests
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for external funnel integrations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input
                    placeholder="e.g., Production Funnel"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createNewApiKey} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {apiSettings.map((setting) => (
              <div key={setting.id} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{setting.name}</span>
                    <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                      {setting.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleApiKeyStatus(setting.id, setting.is_active)}
                    >
                      {setting.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will invalidate the current key. All integrations using this key
                            will need to be updated.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => regenerateApiKey(setting.id)}>
                            Regenerate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This cannot be undone. All integrations using this key will stop
                            working.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApiKey(setting.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">API URL</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm truncate">
                        {baseUrl}/api/v1
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${baseUrl}/api/v1`, 'API URL')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">API Key</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm truncate font-mono">
                        {showKey[setting.id]
                          ? setting.api_key
                          : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(setting.id)}
                      >
                        {showKey[setting.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(setting.api_key, 'API Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">API Secret</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm truncate font-mono">
                        {showSecret[setting.id]
                          ? setting.api_secret
                          : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecretVisibility(setting.id)}
                      >
                        {showSecret[setting.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(setting.api_secret, 'API Secret')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Rate Limits</Label>
                    <p className="text-sm">
                      {setting.rate_limit_per_minute}/min, {setting.rate_limit_per_day}/day
                    </p>
                  </div>
                </div>

                {setting.last_used_at && (
                  <p className="text-sm text-muted-foreground">
                    Last used: {new Date(setting.last_used_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}

            {apiSettings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No API keys created yet. Create one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connected Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Connected Domains
          </CardTitle>
          <CardDescription>
            External domains authorized to send data to this CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectedDomains.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No connected domains. Domains are automatically added when you configure
              allowed origins in your API key settings.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectedDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-mono">{domain.domain}</TableCell>
                    <TableCell>{domain.campaigns?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={domain.is_active ? 'default' : 'secondary'}>
                        {domain.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {domain.ssl_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(domain.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Usage (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No API usage data yet</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {usageStats.slice(0, 4).map((stat) => (
                <div key={stat.date} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {new Date(stat.date).toLocaleDateString()}
                  </p>
                  <p className="text-2xl font-bold">{stat.total_requests}</p>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">{stat.successful} ok</span>
                    <span className="text-red-600">{stat.failed} failed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Requests</CardTitle>
          <CardDescription>Last 50 API requests to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No API requests yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-sm">{req.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.method}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          req.response_status && req.response_status >= 200 && req.response_status < 300
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {req.response_status ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {req.duration_ms}ms
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {req.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>How to use the API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header:
            </p>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
              {`Authorization: Bearer YOUR_API_KEY`}
            </pre>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">ID Format</h4>
            <p className="text-sm text-muted-foreground mb-4">
              The API uses numeric IDs for campaigns and products:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
              <li><strong>campaign_id</strong> - The numeric Campaign ID (e.g., 1, 2, 3)</li>
              <li><strong>product_id</strong> - The numeric Campaign Product ID (e.g., 1, 2, 3)</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Find these IDs in the Campaigns page under the &quot;ID&quot; column, and in Campaign Offers under &quot;Campaign Product ID&quot;.
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Create/Update Customer</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`POST ${baseUrl}/api/v1/customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "customer_status": "lead",
  "campaign_id": 1,
  "product_id": 2,
  "utm_source": "facebook",
  "ship_address_1": "123 Main St",
  "ship_city": "New York",
  "ship_state": "NY",
  "ship_postal_code": "10001",
  "ship_country": "US"
}`}
            </pre>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Note:</strong> campaign_id and product_id are numeric values from your Campaigns dashboard.
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Create Order</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`POST ${baseUrl}/api/v1/orders
Content-Type: application/json

{
  "customer_email": "customer@example.com",
  "campaign_id": "uuid",
  "offer_id": "uuid",
  "items": [
    {
      "name": "Product Name",
      "sku": "SKU-001",
      "quantity": 1,
      "unit_price": 29.99
    }
  ],
  "total": 29.99,
  "payment_status": "paid"
}`}
            </pre>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Note:</strong> Orders API currently uses UUIDs for campaign_id and offer_id. Use the customer response to get the UUID mappings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
