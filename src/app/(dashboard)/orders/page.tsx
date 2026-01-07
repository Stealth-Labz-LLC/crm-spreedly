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
import type { Order, Customer } from '@/types/database'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  processing: 'outline',
  paid: 'default',
  shipped: 'default',
  completed: 'default',
  cancelled: 'destructive',
  refunded: 'destructive',
}

const PAYMENT_STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  authorized: 'outline',
  paid: 'default',
  failed: 'destructive',
  refunded: 'destructive',
  voided: 'secondary',
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')
  const pageSize = 10

  const supabase = await createServiceClient()

  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers!customer_id (
        id,
        email,
        first_name,
        last_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) {
    query = query.or(`order_number.ilike.%${search}%`)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data, count } = await query

  // Define the type for orders with joined customer data
  type OrderWithCustomer = Order & {
    customer: Pick<Customer, 'id' | 'email' | 'first_name' | 'last_name'> | null
  }
  const orders = (data || []) as OrderWithCustomer[]

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage customer orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <form className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by order number..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
            </form>
            <div className="text-sm text-muted-foreground">
              {count || 0} total orders
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const customer = order.customer

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <Link
                            href={`/customers/${customer.id}`}
                            className="hover:underline"
                          >
                            {customer.first_name || customer.last_name
                              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                              : customer.email}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Guest</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[order.status] || 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={PAYMENT_STATUS_COLORS[order.payment_status] || 'secondary'}
                        >
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(order.total).toFixed(2)} {order.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
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
                  <Link href={`/orders?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/orders?page=${page + 1}${search ? `&search=${search}` : ''}`}>
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
