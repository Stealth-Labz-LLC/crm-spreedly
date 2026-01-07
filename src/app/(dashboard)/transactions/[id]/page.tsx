import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  CreditCard,
  User,
  ShoppingCart,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import type { Transaction, TransactionLog } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: transactionData } = await supabase
    .from('transactions')
    .select(`
      *,
      orders (id, order_number),
      customers (id, email, first_name, last_name),
      gateways (id, name, gateway_type),
      customer_payment_methods (card_type, last_four)
    `)
    .eq('id', id)
    .single()

  if (!transactionData) {
    notFound()
  }

  // Define the type for transaction with joined data
  type TransactionWithJoins = Transaction & {
    orders: { id: string; order_number: string } | null
    customers: { id: string; email: string; first_name: string | null; last_name: string | null } | null
    gateways: { id: string; name: string; gateway_type: string } | null
    customer_payment_methods: { card_type: string | null; last_four: string | null } | null
  }
  const transaction = transactionData as TransactionWithJoins

  const { data: logsData } = await supabase
    .from('transaction_logs')
    .select('*')
    .eq('transaction_id', id)
    .order('created_at', { ascending: false })

  const logs = (logsData || []) as TransactionLog[]

  const order = transaction.orders
  const customer = transaction.customers
  const gateway = transaction.gateways
  const paymentMethod = transaction.customer_payment_methods

  const StatusIcon = transaction.status === 'succeeded'
    ? CheckCircle
    : transaction.status === 'declined'
    ? XCircle
    : AlertCircle

  const statusColor = transaction.status === 'succeeded'
    ? 'text-green-500'
    : transaction.status === 'declined'
    ? 'text-red-500'
    : 'text-yellow-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Transaction</h1>
              <Badge variant="outline" className="capitalize">
                {transaction.type}
              </Badge>
              <Badge
                variant={
                  transaction.status === 'succeeded'
                    ? 'default'
                    : transaction.status === 'declined'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {transaction.status}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">
              {transaction.spreedly_transaction_token || 'No token'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
        <div className="text-center">
          <StatusIcon className={`h-12 w-12 mx-auto mb-4 ${statusColor}`} />
          <p className="text-4xl font-bold">
            ${Number(transaction.amount).toFixed(2)}
          </p>
          <p className="text-muted-foreground">{transaction.currency}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Order</CardTitle>
          </CardHeader>
          <CardContent>
            {order ? (
              <Link
                href={`/orders/${order.id}`}
                className="font-medium hover:underline"
              >
                {order.order_number}
              </Link>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <Link
                href={`/customers/${customer.id}`}
                className="font-medium hover:underline"
              >
                {customer.first_name || customer.last_name
                  ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                  : customer.email}
              </Link>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            {gateway ? (
              <Link
                href={`/gateways/${gateway.id}`}
                className="font-medium hover:underline"
              >
                {gateway.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethod ? (
              <div>
                <p className="font-medium capitalize">{paymentMethod.card_type}</p>
                <p className="text-sm text-muted-foreground">
                  **** {paymentMethod.last_four}
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response Code</span>
              <span className="font-mono">{transaction.response_code || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response Message</span>
              <span className="max-w-[200px] truncate">
                {transaction.response_message || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AVS Result</span>
              <span className="font-mono">{transaction.avs_result || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CVV Result</span>
              <span className="font-mono">{transaction.cvv_result || '-'}</span>
            </div>
            {transaction.error_code && (
              <div className="flex justify-between text-red-600">
                <span>Error Code</span>
                <span className="font-mono">{transaction.error_code}</span>
              </div>
            )}
            {transaction.error_detail && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600">
                {transaction.error_detail}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="h-4 w-4" />
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">Transaction Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>API Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                {log.request_body && (
                  <div>
                    <p className="text-xs font-medium mb-1">Request</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(log.request_body, null, 2)}
                    </pre>
                  </div>
                )}
                {log.response_body && (
                  <div>
                    <p className="text-xs font-medium mb-1">Response</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(log.response_body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
