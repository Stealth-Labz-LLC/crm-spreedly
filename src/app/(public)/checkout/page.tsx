'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

interface CheckoutData {
  valid: boolean
  campaign: {
    id: string
    campaign_id: number // Numeric campaign ID (display_id)
    name: string
    description: string | null
    currency: string
    must_agree_tos: boolean
    preauth_only: boolean
  }
  offer: {
    id: string
    product_id: number // Numeric product ID (Campaign Product Id / display_id)
    name: string
    description: string | null
    offer_type: string
    billing_type: string
    trial_enabled: boolean
    trial_type: string | null
    trial_days: number
    trial_price: number
  }
  product: {
    id: string
    name: string
    description: string | null
    sku: string | null
    image_url: string | null
  } | null
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
  shipping_options: Array<{
    id: string
    name: string
    base_cost: number
    free_threshold: number | null
    estimated_days_min: number | null
    estimated_days_max: number | null
  }>
  custom_fields: Array<{
    id: string
    field_name: string
    field_type: string
    field_label: string
    placeholder: string | null
    is_required: boolean
    options: unknown
  }>
  terms_of_service: {
    title: string
    content: string
    version: string
  } | null
  has_coupons: boolean
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [currentPricing, setCurrentPricing] = useState<CheckoutData['pricing'] | null>(null)

  const campaignId = searchParams.get('c')
  const productId = searchParams.get('o') // Campaign Product Id (offer display_id)

  useEffect(() => {
    async function validateCheckout() {
      if (!campaignId || !productId) {
        setError('Invalid checkout link. Missing campaign or product information.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/checkout/validate?c=${campaignId}&o=${productId}`
        )
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load checkout')
          setLoading(false)
          return
        }

        setCheckoutData(data)
        setCurrentPricing(data.pricing)
        setLoading(false)
      } catch {
        setError('Failed to load checkout. Please try again.')
        setLoading(false)
      }
    }

    validateCheckout()
  }, [campaignId, productId])

  const handleCustomerCreated = (id: string) => {
    setCustomerId(id)
  }

  const handlePricingUpdate = (newPricing: CheckoutData['pricing']) => {
    setCurrentPricing(newPricing)
  }

  const handleSuccess = (orderId: string, orderNumber: string) => {
    router.push(`/checkout/thank-you?order=${orderId}&number=${orderNumber}`)
  }

  const handleDecline = (customerId: string, reason: string) => {
    router.push(`/checkout/declined?customer=${customerId}&reason=${encodeURIComponent(reason)}`)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-12 w-48" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h2 className="font-semibold">Checkout Unavailable</h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!checkoutData) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-6">Complete Your Order</h1>
          <CheckoutForm
            campaignId={campaignId!}
            productId={productId!}
            checkoutData={checkoutData}
            customerId={customerId}
            onCustomerCreated={handleCustomerCreated}
            onPricingUpdate={handlePricingUpdate}
            onSuccess={handleSuccess}
            onDecline={handleDecline}
          />
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          <OrderSummary
            product={checkoutData.product}
            offer={checkoutData.offer}
            pricing={currentPricing || checkoutData.pricing}
          />
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}
