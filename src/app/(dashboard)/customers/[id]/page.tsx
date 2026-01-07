import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, Pencil, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import type { Customer, CustomerAddress, CustomerPaymentMethod, Order } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: customerData } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!customerData) {
    notFound()
  }

  const customer = customerData as Customer

  const [
    { data: addressesData },
    { data: paymentMethodsData },
    { data: ordersData },
  ] = await Promise.all([
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', id)
      .order('is_default', { ascending: false }),
    supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', id)
      .eq('is_active', true)
      .order('is_default', { ascending: false }),
    supabase
      .from('orders')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const addresses = (addressesData || []) as CustomerAddress[]
  const paymentMethods = (paymentMethodsData || []) as CustomerPaymentMethod[]
  const orders = (ordersData || []) as Order[]

  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(' ') || 'No name'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
            <p className="text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <Link href={`/customers/${id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{customer.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{customer.phone || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                customer.status === 'active'
                  ? 'default'
                  : customer.status === 'inactive'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {customer.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders?.length || 0})</TabsTrigger>
          <TabsTrigger value="addresses">
            Addresses ({addresses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payment-methods">
            Payment Methods ({paymentMethods?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {!orders?.length ? (
                <p className="text-muted-foreground text-sm">No orders yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
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
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{order.payment_status}</Badge>
                        </TableCell>
                        <TableCell>
                          ${Number(order.total).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {!addresses?.length ? (
                <p className="text-muted-foreground text-sm">No addresses on file</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium capitalize">
                            {address.type}
                          </span>
                        </div>
                        {address.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          {address.first_name} {address.last_name}
                        </p>
                        <p>{address.address_1}</p>
                        {address.address_2 && <p>{address.address_2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {!paymentMethods?.length ? (
                <p className="text-muted-foreground text-sm">
                  No payment methods on file
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium capitalize">
                            {pm.card_type || 'Card'}
                          </span>
                        </div>
                        {pm.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>**** **** **** {pm.last_four}</p>
                        <p>
                          Expires: {pm.exp_month?.toString().padStart(2, '0')}/
                          {pm.exp_year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
