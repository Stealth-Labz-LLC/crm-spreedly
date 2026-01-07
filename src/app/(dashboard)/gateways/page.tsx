import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/auth/organization-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Activity } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GatewayActions } from './gateway-actions'
import type { Gateway, Transaction } from '@/types/database'

interface PageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function GatewaysPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''

  const { organization } = await getOrganizationContext()
  const supabase = await createServiceClient()

  let query = supabase
    .from('gateways')
    .select('*')
    .eq('organization_id', organization.id)
    .order('priority', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,gateway_type.ilike.%${search}%`)
  }

  const { data } = await query
  const gateways = (data || []) as Gateway[]

  // Get transaction metrics for each gateway
  const gatewayMetrics: Record<string, { total: number; success: number }> = {}
  if (gateways.length) {
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('gateway_id, status')
      .in('gateway_id', gateways.map(g => g.id))

    const transactions = (transactionsData || []) as Pick<Transaction, 'gateway_id' | 'status'>[]
    transactions.forEach((t) => {
      if (!gatewayMetrics[t.gateway_id!]) {
        gatewayMetrics[t.gateway_id!] = { total: 0, success: 0 }
      }
      gatewayMetrics[t.gateway_id!].total++
      if (t.status === 'succeeded') {
        gatewayMetrics[t.gateway_id!].success++
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="text-muted-foreground">
            Configure and manage your payment processors
          </p>
        </div>
        <Link href="/gateways/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Gateway
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <form className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search gateways..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
            </form>
            <div className="text-sm text-muted-foreground">
              {gateways.length} gateways
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gateway</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Volume Cap</TableHead>
                <TableHead>Approval Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No gateways configured</p>
                    <Link href="/gateways/new">
                      <Button variant="link" className="mt-2">
                        Add your first gateway
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                gateways.map((gateway) => {
                  const metrics = gatewayMetrics[gateway.id] || { total: 0, success: 0 }
                  const approvalRate = metrics.total > 0
                    ? ((metrics.success / metrics.total) * 100).toFixed(1)
                    : '-'
                  const volumeUsed = gateway.monthly_cap
                    ? ((Number(gateway.current_month_volume) / Number(gateway.monthly_cap)) * 100).toFixed(0)
                    : null

                  return (
                    <TableRow key={gateway.id}>
                      <TableCell>
                        <Link
                          href={`/gateways/${gateway.id}`}
                          className="font-medium hover:underline"
                        >
                          {gateway.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {gateway.gateway_type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{gateway.priority}</span>
                      </TableCell>
                      <TableCell>
                        {gateway.monthly_cap ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              ${Number(gateway.current_month_volume).toLocaleString()} / ${Number(gateway.monthly_cap).toLocaleString()}
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${Math.min(Number(volumeUsed), 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No cap</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{approvalRate}%</span>
                          <span className="text-muted-foreground text-xs">
                            ({metrics.total} txns)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={gateway.is_active ? 'default' : 'secondary'}
                        >
                          {gateway.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <GatewayActions gateway={gateway} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
