'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('number')

  return (
    <div className="max-w-xl mx-auto px-4">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Thank You for Your Order!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your order has been successfully placed and is being processed.
          </p>

          {orderNumber && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-mono font-bold">{orderNumber}</p>
            </div>
          )}

          <div className="pt-4 space-y-2 text-sm text-muted-foreground">
            <p>A confirmation email has been sent to your email address.</p>
            <p>You can save this page for your records.</p>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>We&apos;ll process your payment and confirm your order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>Your order will be prepared for shipment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>You&apos;ll receive tracking information via email</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="max-w-xl mx-auto px-4">
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ThankYouContent />
    </Suspense>
  )
}
