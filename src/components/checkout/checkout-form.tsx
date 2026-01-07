'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { User, MapPin, CreditCard, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckoutData {
  campaign: {
    id: string
    name: string
    currency: string
    must_agree_tos: boolean
  }
  offer: {
    id: string
    name: string
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
  } | null
  has_coupons: boolean
}

interface CheckoutFormProps {
  campaignId: string
  productId: string // Campaign Product Id (offer display_id)
  checkoutData: CheckoutData
  customerId: string | null
  onCustomerCreated: (id: string) => void
  onPricingUpdate: (pricing: CheckoutData['pricing']) => void
  onSuccess: (orderId: string, orderNumber: string) => void
  onDecline: (customerId: string, reason: string) => void
}

const STEPS = [
  { id: 1, name: 'Contact', icon: User },
  { id: 2, name: 'Shipping', icon: MapPin },
  { id: 3, name: 'Payment', icon: CreditCard },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

export function CheckoutForm({
  campaignId,
  productId,
  checkoutData,
  customerId,
  onCustomerCreated,
  onPricingUpdate,
  onSuccess,
  onDecline,
}: CheckoutFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [internalCustomerId, setInternalCustomerId] = useState(customerId)
  const [checkoutTotals, setCheckoutTotals] = useState<Record<string, unknown> | null>(null)

  // Step 1: Contact Info
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2: Shipping Address
  const [shipAddress1, setShipAddress1] = useState('')
  const [shipAddress2, setShipAddress2] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipState, setShipState] = useState('')
  const [shipPostalCode, setShipPostalCode] = useState('')
  const [shipCountry] = useState('US')
  const [billSameAsShip, setBillSameAsShip] = useState(true)

  // Billing Address (if different)
  const [billAddress1, setBillAddress1] = useState('')
  const [billAddress2, setBillAddress2] = useState('')
  const [billCity, setBillCity] = useState('')
  const [billState, setBillState] = useState('')
  const [billPostalCode, setBillPostalCode] = useState('')
  const [billCountry] = useState('US')

  // Coupon
  const [couponCode, setCouponCode] = useState('')

  // Step 3: Payment
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(!checkoutData.terms_of_service)

  // Step 1: Submit Contact Info
  const handleStep1Submit = async () => {
    if (!email || !firstName || !lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/checkout/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          product_id: productId, // Campaign Product Id
          customer_id: internalCustomerId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to save contact information')
        return
      }

      setInternalCustomerId(data.customer_id)
      onCustomerCreated(data.customer_id)
      setCurrentStep(2)
    } catch (error) {
      toast.error('Failed to save contact information')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Submit Shipping Address
  const handleStep2Submit = async () => {
    if (!shipAddress1 || !shipCity || !shipState || !shipPostalCode) {
      toast.error('Please fill in all required shipping fields')
      return
    }

    if (!billSameAsShip && (!billAddress1 || !billCity || !billState || !billPostalCode)) {
      toast.error('Please fill in all required billing fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/checkout/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: internalCustomerId,
          shipping_address: {
            address_1: shipAddress1,
            address_2: shipAddress2,
            city: shipCity,
            state: shipState,
            postal_code: shipPostalCode,
            country: shipCountry,
          },
          billing_address: billSameAsShip ? null : {
            address_1: billAddress1,
            address_2: billAddress2,
            city: billCity,
            state: billState,
            postal_code: billPostalCode,
            country: billCountry,
          },
          bill_same_as_ship: billSameAsShip,
          coupon_code: couponCode || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to save address')
        return
      }

      // Update pricing with tax calculated
      if (data.pricing) {
        onPricingUpdate(data.pricing)
      }

      // Store checkout totals for payment step
      if (data.checkout_totals) {
        setCheckoutTotals(data.checkout_totals)
      }

      setCurrentStep(3)
    } catch (error) {
      toast.error('Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Submit Payment
  const handleStep3Submit = async () => {
    if (!cardNumber || !cardExpiry || !cardCvv) {
      toast.error('Please fill in all payment fields')
      return
    }

    if (checkoutData.terms_of_service && !agreedToTerms) {
      toast.error('Please agree to the terms of service')
      return
    }

    const [expMonth, expYear] = cardExpiry.split('/')
    if (!expMonth || !expYear) {
      toast.error('Invalid expiry date format')
      return
    }

    setLoading(true)
    try {
      // Note: In production, you would tokenize the card with Spreedly first
      // For this demo, we're sending card details directly (NOT RECOMMENDED FOR PRODUCTION)
      // Use Spreedly Express or iFrame for PCI compliance

      const response = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: internalCustomerId,
          // In production, this would be a Spreedly token
          payment_method_token: `demo_${Date.now()}`,
          card_type: getCardType(cardNumber),
          card_last_four: cardNumber.slice(-4),
          card_exp_month: parseInt(expMonth),
          card_exp_year: parseInt('20' + expYear),
          checkout_totals: checkoutTotals,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess(data.order_id, data.order_number)
      } else {
        onDecline(internalCustomerId!, data.error || 'Payment declined')
      }
    } catch (error) {
      toast.error('Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  // Detect card type from number
  const getCardType = (number: string): string => {
    const patterns: Record<string, RegExp> = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
    }

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(number)) return type
    }
    return 'unknown'
  }

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const groups = numbers.match(/.{1,4}/g)
    return groups ? groups.join(' ') : ''
  }

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4)
    }
    return numbers
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                currentStep > step.id
                  ? 'bg-primary border-primary text-primary-foreground'
                  : currentStep === step.id
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <span
              className={cn(
                'ml-2 text-sm font-medium hidden sm:inline',
                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step.name}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-24 h-0.5 mx-4',
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Contact Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Enter your contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleStep1Submit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue to Shipping'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Shipping Address */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription>Where should we send your order?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipAddress1">Address *</Label>
              <Input
                id="shipAddress1"
                placeholder="123 Main St"
                value={shipAddress1}
                onChange={(e) => setShipAddress1(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipAddress2">Apartment, suite, etc.</Label>
              <Input
                id="shipAddress2"
                placeholder="Apt 4B"
                value={shipAddress2}
                onChange={(e) => setShipAddress2(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipCity">City *</Label>
                <Input
                  id="shipCity"
                  placeholder="New York"
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipState">State *</Label>
                <Select value={shipState} onValueChange={setShipState}>
                  <SelectTrigger id="shipState">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipPostalCode">ZIP Code *</Label>
                <Input
                  id="shipPostalCode"
                  placeholder="10001"
                  value={shipPostalCode}
                  onChange={(e) => setShipPostalCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value="United States" disabled />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="billSameAsShip"
                checked={billSameAsShip}
                onCheckedChange={(checked) => setBillSameAsShip(checked as boolean)}
              />
              <Label htmlFor="billSameAsShip" className="text-sm font-normal">
                Billing address same as shipping
              </Label>
            </div>

            {/* Billing Address (if different) */}
            {!billSameAsShip && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Billing Address</h3>

                <div className="space-y-2">
                  <Label htmlFor="billAddress1">Address *</Label>
                  <Input
                    id="billAddress1"
                    placeholder="123 Main St"
                    value={billAddress1}
                    onChange={(e) => setBillAddress1(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billAddress2">Apartment, suite, etc.</Label>
                  <Input
                    id="billAddress2"
                    placeholder="Apt 4B"
                    value={billAddress2}
                    onChange={(e) => setBillAddress2(e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billCity">City *</Label>
                    <Input
                      id="billCity"
                      placeholder="New York"
                      value={billCity}
                      onChange={(e) => setBillCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billState">State *</Label>
                    <Select value={billState} onValueChange={setBillState}>
                      <SelectTrigger id="billState">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billPostalCode">ZIP Code *</Label>
                  <Input
                    id="billPostalCode"
                    placeholder="10001"
                    value={billPostalCode}
                    onChange={(e) => setBillPostalCode(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* Coupon */}
            {checkoutData.has_coupons && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="couponCode">Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="couponCode"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleStep2Submit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Enter your payment details securely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4111 1111 1111 1111"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry (MM/YY)</Label>
                <Input
                  id="cardExpiry"
                  placeholder="12/25"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                />
              </div>
            </div>

            {/* Terms of Service */}
            {checkoutData.terms_of_service && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreedToTerms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm font-normal leading-relaxed">
                    I agree to the{' '}
                    <a
                      href="#"
                      className="text-primary underline"
                      onClick={(e) => {
                        e.preventDefault()
                        // Show terms modal in production
                        toast.info(checkoutData.terms_of_service?.title || 'Terms of Service')
                      }}
                    >
                      Terms of Service
                    </a>
                  </Label>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleStep3Submit}
                disabled={loading || !!(checkoutData.terms_of_service && !agreedToTerms)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Order'
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your payment information is encrypted and secure.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
