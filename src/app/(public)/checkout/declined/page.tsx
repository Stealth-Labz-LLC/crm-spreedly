'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { XCircle, CreditCard, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function DeclinedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const customerId = searchParams.get('customer')
  const reason = searchParams.get('reason') || 'Payment was declined'

  const [retrying, setRetrying] = useState(false)
  const [showRetryForm, setShowRetryForm] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const handleRetry = async () => {
    if (!customerId) {
      toast.error('Unable to retry. Please start a new checkout.')
      return
    }

    // In production, you would tokenize the card with Spreedly here
    // For now, show the retry form
    setShowRetryForm(true)
  }

  const submitRetry = async () => {
    if (!cardNumber || !expiry || !cvv) {
      toast.error('Please fill in all card details')
      return
    }

    setRetrying(true)

    try {
      // Note: In production, you would:
      // 1. Tokenize the card using Spreedly Express or iFrame
      // 2. Send the token to the /api/checkout/retry endpoint
      // For demo purposes, showing the flow:

      const response = await fetch('/api/checkout/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          payment_method_token: 'demo_token', // Would come from Spreedly
          card_type: 'visa',
          card_last_four: cardNumber.slice(-4),
          card_exp_month: parseInt(expiry.split('/')[0]),
          card_exp_year: parseInt('20' + expiry.split('/')[1]),
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/checkout/thank-you?order=${data.order_id}&number=${data.order_number}`)
      } else {
        toast.error(data.error || 'Payment was declined again')
      }
    } catch {
      toast.error('Failed to process payment. Please try again.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Declined</CardTitle>
          <CardDescription>
            We were unable to process your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Decline Reason</p>
                <p className="text-sm text-amber-700 mt-1">{decodeURIComponent(reason)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Common reasons for declines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Insufficient funds in the account</li>
              <li>Card information entered incorrectly</li>
              <li>Card issuer blocked the transaction</li>
              <li>Expired card</li>
            </ul>
          </div>

          {!showRetryForm ? (
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleRetry}
                disabled={!customerId}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Try a Different Card
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your information is saved. You only need to enter new payment details.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Enter New Card Details</h3>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="4111 1111 1111 1111"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={16}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                  <Input
                    id="expiry"
                    placeholder="12/25"
                    value={expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4)
                      }
                      setExpiry(value)
                    }}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={submitRetry}
                disabled={retrying}
              >
                {retrying ? 'Processing...' : 'Complete Purchase'}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowRetryForm(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Need help? Contact our support team.</p>
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

export default function DeclinedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DeclinedContent />
    </Suspense>
  )
}
