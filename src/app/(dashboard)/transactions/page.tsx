import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Transaction } from '@/types/database'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; status?: string; type?: string }>
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')
  const pageSize = 20

  const supabase = await createServiceClient()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      orders (order_number),
      customers (email, first_name, last_name),
      gateways (name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.type) {
    query = query.eq('type', params.type)
  }

  const { data, count } = await query

  // Define the type for transactions with joined data
  type TransactionWithJoins = Transaction & {
    orders: { order_number: string } | null
    customers: { email: string; first_name: string | null; last_name: string | null } | null
    gateways: { name: string } | null
  }
  const transactions = (data || []) as TransactionWithJoins[]

  const totalPages = Math.ceil((count || 0) / pageSize)

  // Calculate summary stats
  const { data: statsData } = await supabase
    .from('transactions')
    .select('status, amount')

  const stats = (statsData || []) as Pick<Transaction, 'status' | 'amount'>[]

  const summary = {
    total: stats.length,
    succeeded: stats.filter(t => t.status === 'succeeded').length,
    declined: stats.filter(t => t.status === 'declined').length,
    volume: stats.filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          View all payment transactions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{summary.succeeded}</div>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{summary.declined}</div>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${summary.volume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total Volume</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <form className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search transactions..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <Link href="/transactions">
                <Button variant={!params.status ? 'default' : 'outline'} size="sm">
                  All
                </Button>
              </Link>
              <Link href="/transactions?status=succeeded">
                <Button
                  variant={params.status === 'succeeded' ? 'default' : 'outline'}
                  size="sm"
                >
                  Succeeded
                </Button>
              </Link>
              <Link href="/transactions?status=declined">
                <Button
                  variant={params.status === 'declined' ? 'default' : 'outline'}
                  size="sm"
                >
                  Declined
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No transactions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => {
                  const order = txn.orders
                  const customer = txn.customers
                  const gateway = txn.gateways

                  return (
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
                        {order ? (
                          <Link
                            href={`/orders/${txn.order_id}`}
                            className="hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <Link
                            href={`/customers/${txn.customer_id}`}
                            className="hover:underline"
                          >
                            {customer.first_name || customer.last_name
                              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                              : customer.email}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {gateway?.name || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(txn.amount).toFixed(2)} {txn.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(txn.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/transactions?page=${page - 1}${
                      params.status ? `&status=${params.status}` : ''
                    }`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/transactions?page=${page + 1}${
                      params.status ? `&status=${params.status}` : ''
                    }`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
