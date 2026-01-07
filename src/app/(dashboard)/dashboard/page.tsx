import { createServiceClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/auth/organization-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, ShoppingCart, CreditCard, TrendingUp, DollarSign } from 'lucide-react'
import type { Order, Transaction } from '@/types/database'

async function getDashboardStats(organizationId: string) {
  const supabase = await createServiceClient()

  const [
    { count: customerCount },
    { count: productCount },
    { count: orderCount },
    { count: gatewayCount },
    { data: recentOrdersData },
    { data: transactionsData },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('gateways').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('orders').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions').select('amount, status').eq('status', 'succeeded'),
  ])

  const recentOrders = (recentOrdersData || []) as Order[]
  const transactions = (transactionsData || []) as Pick<Transaction, 'amount' | 'status'>[]
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    customerCount: customerCount || 0,
    productCount: productCount || 0,
    orderCount: orderCount || 0,
    gatewayCount: gatewayCount || 0,
    totalRevenue,
    recentOrders,
  }
}

export default async function DashboardPage() {
  const { organization } = await getOrganizationContext()
  const stats = await getDashboardStats(organization.id)

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.customerCount.toLocaleString(),
      icon: Users,
      description: 'Active customers in the system',
    },
    {
      title: 'Products',
      value: stats.productCount.toLocaleString(),
      icon: Package,
      description: 'Products in catalog',
    },
    {
      title: 'Total Orders',
      value: stats.orderCount.toLocaleString(),
      icon: ShoppingCart,
      description: 'All time orders',
    },
    {
      title: 'Active Gateways',
      value: stats.gatewayCount.toLocaleString(),
      icon: CreditCard,
      description: 'Payment gateways configured',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'From successful transactions',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your CRM metrics and recent activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${Number(order.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/customers"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Add Customer</p>
                  <p className="text-sm text-muted-foreground">
                    Create a new customer record
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/products"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Add Product</p>
                  <p className="text-sm text-muted-foreground">
                    Add a new product to catalog
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/gateways"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Configure Gateway</p>
                  <p className="text-sm text-muted-foreground">
                    Set up a payment gateway
                  </p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
