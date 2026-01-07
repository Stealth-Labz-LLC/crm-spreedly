import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  Pencil,
  Activity,
  TrendingUp,
  TrendingDown,
  CreditCard,
  DollarSign,
} from 'lucide-react'
import type { Gateway, Transaction } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GatewayDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: gatewayData } = await supabase
    .from('gateways')
    .select('*')
    .eq('id', id)
    .single()

  if (!gatewayData) {
    notFound()
  }

  const gateway = gatewayData as Gateway

  // Get transaction metrics
  const { data: transactionsData } = await supabase
    .from('transactions')
    .select('*')
    .eq('gateway_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const transactions = (transactionsData || []) as Transaction[]

  const { data: allTransactionsData } = await supabase
    .from('transactions')
    .select('status, amount')
    .eq('gateway_id', id)

  const allTransactions = (allTransactionsData || []) as Pick<Transaction, 'status' | 'amount'>[]

  const metrics = {
    total: allTransactions.length,
    succeeded: allTransactions.filter(t => t.status === 'succeeded').length,
    declined: allTransactions.filter(t => t.status === 'declined').length,
    volume: allTransactions.filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  }

  const approvalRate = metrics.total > 0
    ? ((metrics.succeeded / metrics.total) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/gateways">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {gateway.name}
              </h1>
              <Badge variant={gateway.is_active ? 'default' : 'secondary'}>
                {gateway.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">
              {gateway.gateway_type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <Link href={`/gateways/${id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Gateway
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvalRate}%</p>
            <p className="text-sm text-muted-foreground">
              {metrics.total} total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{metrics.succeeded}</p>
            <p className="text-sm text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{metrics.declined}</p>
            <p className="text-sm text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${metrics.volume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">all time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Priority</span>
              <span className="font-mono">{gateway.priority}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Monthly Cap</span>
              <span>
                {gateway.monthly_cap
                  ? `$${Number(gateway.monthly_cap).toLocaleString()}`
                  : 'No cap'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Current Month Volume</span>
              <span>${Number(gateway.current_month_volume).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Amount Range</span>
              <span>
                {gateway.min_amount || gateway.max_amount
                  ? `$${gateway.min_amount || 0} - $${gateway.max_amount || '∞'}`
                  : 'No limits'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statement Descriptor</span>
              <span>{gateway.descriptor || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accepted Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Currencies</p>
              <div className="flex flex-wrap gap-2">
                {gateway.accepted_currencies.map((currency) => (
                  <Badge key={currency} variant="outline">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Card Types</p>
              <div className="flex flex-wrap gap-2">
                {gateway.accepted_card_types.map((cardType) => (
                  <Badge key={cardType} variant="secondary" className="capitalize">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {cardType}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          txn.status === 'succeeded'
                            ? 'default'
                            : txn.status === 'declined'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${Number(txn.amount).toFixed(2)} {txn.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {txn.response_message || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(txn.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
