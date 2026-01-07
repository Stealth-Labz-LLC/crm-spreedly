import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ChevronLeft,
  User,
  MapPin,
  CreditCard,
  Package,
  Clock,
  Megaphone,
  Tag,
} from 'lucide-react'
import type { Order, OrderItem, Transaction, CustomerAddress } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers!customer_id (
        id,
        email,
        first_name,
        last_name,
        phone,
        display_id
      ),
      campaign:campaigns!campaign_id (
        id,
        name,
        display_id
      ),
      offer:campaign_offers!offer_id (
        id,
        name,
        display_id,
        offer_type
      )
    `)
    .eq('id', id)
    .single()

  if (!orderData) {
    notFound()
  }

  // Define the type for order with joined data
  type OrderWithRelations = Order & {
    customer: {
      id: string
      email: string
      first_name: string | null
      last_name: string | null
      phone: string | null
      display_id: number
    } | null
    campaign: {
      id: string
      name: string
      display_id: number
    } | null
    offer: {
      id: string
      name: string
      display_id: number
      offer_type: string
    } | null
  }
  const order = orderData as OrderWithRelations
  const customer = order.customer
  const campaign = order.campaign
  const offer = order.offer

  const [
    { data: orderItemsData },
    { data: transactionsData },
    { data: billingAddressData },
    { data: shippingAddressData },
  ] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', id),
    supabase
      .from('transactions')
      .select(`
        *,
        gateways (name)
      `)
      .eq('order_id', id)
      .order('created_at', { ascending: false }),
    order.billing_address_id
      ? supabase.from('customer_addresses').select('*').eq('id', order.billing_address_id).single()
      : Promise.resolve({ data: null }),
    order.shipping_address_id
      ? supabase.from('customer_addresses').select('*').eq('id', order.shipping_address_id).single()
      : Promise.resolve({ data: null }),
  ])

  const orderItems = (orderItemsData || []) as OrderItem[]

  // Define the type for transactions with joined gateway data
  type TransactionWithGateway = Transaction & {
    gateways: { name: string } | null
  }
  const transactions = (transactionsData || []) as TransactionWithGateway[]

  const billingAddress = billingAddressData as CustomerAddress | null
  const shippingAddress = shippingAddressData as CustomerAddress | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {order.order_number}
              </h1>
              <Badge
                variant={
                  order.status === 'completed' || order.status === 'paid'
                    ? 'default'
                    : order.status === 'cancelled' || order.status === 'refunded'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-1">
                <Link
                  href={`/customers/${customer.id}`}
                  className="font-medium hover:underline"
                >
                  {customer.first_name || customer.last_name
                    ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                    : 'No name'}
                </Link>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                {customer.phone && (
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Guest checkout</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                order.payment_status === 'paid'
                  ? 'default'
                  : order.payment_status === 'failed' ||
                    order.payment_status === 'refunded'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {order.payment_status}
            </Badge>
            <p className="text-2xl font-bold mt-2">
              ${Number(order.total).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">{order.currency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Fulfillment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{order.fulfillment_status}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Attribution Section */}
      {(campaign || offer) && (
        <div className="grid gap-6 md:grid-cols-2">
          {campaign && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/campaigns/${campaign.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {campaign.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  ID: {campaign.display_id}
                </p>
              </CardContent>
            </Card>
          )}

          {offer && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{offer.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {offer.offer_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ID: {offer.display_id}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {billingAddress && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>{billingAddress.first_name} {billingAddress.last_name}</p>
                <p>{billingAddress.address_1}</p>
                {billingAddress.address_2 && <p>{billingAddress.address_2}</p>}
                <p>
                  {billingAddress.city}, {billingAddress.state}{' '}
                  {billingAddress.postal_code}
                </p>
                <p>{billingAddress.country}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {shippingAddress && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>{shippingAddress.first_name} {shippingAddress.last_name}</p>
                <p>{shippingAddress.address_1}</p>
                {shippingAddress.address_2 && <p>{shippingAddress.address_2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state}{' '}
                  {shippingAddress.postal_code}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sku || '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${Number(item.unit_price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(item.total).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            {Number(order.tax) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
            )}
            {Number(order.shipping) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>${Number(order.shipping).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)} {order.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Clock className="h-4 w-4" />
          <CardTitle>Transaction History</CardTitle>
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
                  <TableHead>Gateway</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {txn.gateways?.name || '-'}
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
