'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'

interface OrderSummaryProps {
  product: {
    id: string
    name: string
    description: string | null
    sku: string | null
    image_url: string | null
  } | null
  offer: {
    id: string
    name: string
    description: string | null
    offer_type: string
    billing_type: string
    trial_enabled: boolean
    trial_days: number
    trial_price: number
  }
  pricing: {
    base_price: number
    discount_amount: number
    discount_type: string | null
    subtotal: number
    shipping: number
    tax: number
    total: number
    currency: string
  }
}

export function OrderSummary({ product, offer, pricing }: OrderSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: pricing.currency,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product */}
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            {product?.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{product?.name || offer.name}</h3>
            {product?.sku && (
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            )}
            {offer.trial_enabled && (
              <Badge variant="secondary" className="mt-1">
                {offer.trial_days}-Day Trial
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(pricing.base_price)}</p>
            {pricing.discount_amount > 0 && (
              <p className="text-sm text-green-600">
                -{formatCurrency(pricing.discount_amount)}
              </p>
            )}
          </div>
        </div>

        {/* Offer description */}
        {offer.description && (
          <p className="text-sm text-muted-foreground">{offer.description}</p>
        )}

        <Separator />

        {/* Pricing breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(pricing.subtotal)}</span>
          </div>

          {pricing.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(pricing.discount_amount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {pricing.shipping === 0 ? 'FREE' : formatCurrency(pricing.shipping)}
            </span>
          </div>

          {pricing.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(pricing.tax)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold">{formatCurrency(pricing.total)}</span>
        </div>

        {/* Trial info */}
        {offer.trial_enabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800">Trial Offer</p>
            <p className="text-blue-700 mt-1">
              {offer.trial_price === 0
                ? `Free ${offer.trial_days}-day trial, then ${formatCurrency(pricing.subtotal)}/cycle`
                : `${formatCurrency(offer.trial_price)} for ${offer.trial_days} days, then ${formatCurrency(pricing.subtotal)}/cycle`
              }
            </p>
          </div>
        )}

        {/* Billing type indicator */}
        {offer.billing_type === 'recurring' && (
          <div className="text-xs text-muted-foreground text-center">
            Billed {offer.billing_type}. Cancel anytime.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
