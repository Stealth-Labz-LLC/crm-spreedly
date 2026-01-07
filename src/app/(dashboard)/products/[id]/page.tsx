import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Pencil, DollarSign, Calendar, Clock, Tag } from 'lucide-react'
import type { Product } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) {
    notFound()
  }

  const product = data as Product

  const formatBillingInterval = () => {
    if (product.billing_type !== 'subscription') return null
    const count = product.billing_interval_count
    const interval = product.billing_interval
    if (count === 1) return `per ${interval}`
    return `every ${count} ${interval}s`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {product.name}
              </h1>
              <Badge
                variant={
                  product.status === 'active'
                    ? 'default'
                    : product.status === 'inactive'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {product.status}
              </Badge>
            </div>
            {product.sku && (
              <p className="text-muted-foreground">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        <Link href={`/products/${id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${Number(product.price).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">{product.currency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Billing Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                product.billing_type === 'subscription' ? 'default' : 'secondary'
              }
              className="text-sm"
            >
              {product.billing_type}
            </Badge>
            {product.billing_type === 'subscription' && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatBillingInterval()}
              </p>
            )}
          </CardContent>
        </Card>

        {product.billing_type === 'subscription' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Trial Period</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{product.trial_days}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Setup Fee</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${Number(product.setup_fee).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">one-time</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(product.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{new Date(product.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
