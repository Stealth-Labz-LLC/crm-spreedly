'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignOffer, Product, OfferBillingCycle } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Pencil, Trash2, GripVertical, Info, ArrowLeft, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface OffersSectionProps {
  campaignId: string
}

interface Gateway {
  id: string
  name: string
  gateway_type: string
}

interface BillingCycle {
  id?: string
  cycle_number: number
  price: number
  ship_price: number
  bill_delay_days: number
  is_shippable: boolean
  product_id: string | null
}

const BILLING_TYPES = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'installment', label: 'Installment' },
]

const TRIAL_TYPES = [
  { value: 'free', label: 'Free Trial' },
  { value: 'paid', label: 'Paid Trial' },
  { value: 'shipping_only', label: 'Shipping Only' },
]

const TRIAL_AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'full', label: 'Full Authorization' },
  { value: 'partial', label: 'Partial Authorization' },
]

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export function OffersSection({ campaignId }: OffersSectionProps) {
  const supabase = createClient()
  const [offers, setOffers] = useState<(CampaignOffer & { product?: Product; gateway?: Gateway; billing_cycles?: BillingCycle[] })[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingOffer, setEditingOffer] = useState<CampaignOffer | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for the full offer editor
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    offer_type: 'standard',
    product_id: '',
    gateway_id: '',
    dynamic_descriptor: '',
    qty_per_order: 1,
    price_override: '',
    ship_price: '',
    // Billing schedule
    billing_type: 'one_time',
    final_billing_cycle: '',
    fixed_billing_day: '',
    persistent_rebill_day: false,
    stagger_fulfillments: false,
    stagger_payments: false,
    use_chargeback_protection: false,
    delay_fulfillment_on_rebill: false,
    fulfillment_delay_days: 1,
    bill_on_saturday: false,
    bundle_subscriptions: false,
    block_prepaid_cards: false,
    stand_alone_transaction: false,
    // Trial options
    trial_enabled: false,
    trial_type: '',
    trial_auth_type: 'none',
    trial_days: 0,
    trial_price: 0,
    allow_multiple_trials: false,
    // Order limits
    max_price: '',
    max_quantity: '',
  })

  // Billing cycles for recurring offers
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([
    { cycle_number: 1, price: 0, ship_price: 0, bill_delay_days: 30, is_shippable: true, product_id: null }
  ])

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    // Load offers with product and gateway data
    const { data: offersData, error: offersError } = await supabase
      .from('campaign_offers')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('position')

    if (offersError) {
      toast.error('Failed to load offers')
      return
    }

    // Load all products for selection
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('name')

    // Load gateways
    const { data: gatewaysData } = await supabase
      .from('gateways')
      .select('id, name, gateway_type')
      .eq('is_active', true)
      .order('name')

    // Load billing cycles for each offer
    const offerIds = (offersData || []).map((o: { id: string }) => o.id)
    let cyclesData: OfferBillingCycle[] = []
    if (offerIds.length > 0) {
      const { data } = await supabase
        .from('offer_billing_cycles')
        .select('*')
        .in('offer_id', offerIds)
        .order('cycle_number')
      cyclesData = (data || []) as OfferBillingCycle[]
    }

    // Enrich offers with products, gateways, and cycles
    const enrichedOffers = (offersData || []).map((offer: CampaignOffer) => {
      const product = (productsData || []).find((p: Product) => p.id === offer.product_id)
      const gateway = (gatewaysData || []).find((g: Gateway) => g.id === offer.gateway_id)
      const cycles = cyclesData.filter(c => c.offer_id === offer.id)
      return { ...offer, product, gateway, billing_cycles: cycles }
    })

    setOffers(enrichedOffers)
    setProducts((productsData || []) as Product[])
    setGateways((gatewaysData || []) as Gateway[])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      offer_type: 'standard',
      product_id: '',
      gateway_id: '',
      dynamic_descriptor: '',
      qty_per_order: 1,
      price_override: '',
      ship_price: '',
      billing_type: 'one_time',
      final_billing_cycle: '',
      fixed_billing_day: '',
      persistent_rebill_day: false,
      stagger_fulfillments: false,
      stagger_payments: false,
      use_chargeback_protection: false,
      delay_fulfillment_on_rebill: false,
      fulfillment_delay_days: 1,
      bill_on_saturday: false,
      bundle_subscriptions: false,
      block_prepaid_cards: false,
      stand_alone_transaction: false,
      trial_enabled: false,
      trial_type: '',
      trial_auth_type: 'none',
      trial_days: 0,
      trial_price: 0,
      allow_multiple_trials: false,
      max_price: '',
      max_quantity: '',
    })
    setBillingCycles([
      { cycle_number: 1, price: 0, ship_price: 0, bill_delay_days: 30, is_shippable: true, product_id: null }
    ])
    setEditingOffer(null)
  }

  const handleEdit = (offer: CampaignOffer & { billing_cycles?: BillingCycle[] }) => {
    setEditingOffer(offer)
    setFormData({
      name: offer.name,
      display_name: offer.display_name || '',
      description: offer.description || '',
      offer_type: offer.offer_type,
      product_id: offer.product_id || '',
      gateway_id: offer.gateway_id || '',
      dynamic_descriptor: offer.dynamic_descriptor || '',
      qty_per_order: offer.qty_per_order || 1,
      price_override: offer.price_override?.toString() || '',
      ship_price: offer.ship_price?.toString() || '',
      billing_type: offer.billing_type || 'one_time',
      final_billing_cycle: offer.final_billing_cycle?.toString() || '',
      fixed_billing_day: offer.fixed_billing_day?.toString() || '',
      persistent_rebill_day: offer.persistent_rebill_day || false,
      stagger_fulfillments: offer.stagger_fulfillments || false,
      stagger_payments: offer.stagger_payments || false,
      use_chargeback_protection: offer.use_chargeback_protection || false,
      delay_fulfillment_on_rebill: offer.delay_fulfillment_on_rebill || false,
      fulfillment_delay_days: offer.fulfillment_delay_days || 1,
      bill_on_saturday: offer.bill_on_saturday || false,
      bundle_subscriptions: offer.bundle_subscriptions || false,
      block_prepaid_cards: offer.block_prepaid_cards || false,
      stand_alone_transaction: offer.stand_alone_transaction || false,
      trial_enabled: offer.trial_enabled || false,
      trial_type: offer.trial_type || '',
      trial_auth_type: offer.trial_auth_type || 'none',
      trial_days: offer.trial_days || 0,
      trial_price: offer.trial_price || 0,
      allow_multiple_trials: offer.allow_multiple_trials || false,
      max_price: offer.max_price?.toString() || '',
      max_quantity: offer.max_quantity?.toString() || '',
    })
    if (offer.billing_cycles && offer.billing_cycles.length > 0) {
      setBillingCycles(offer.billing_cycles)
    } else {
      setBillingCycles([
        { cycle_number: 1, price: offer.price_override || 0, ship_price: offer.ship_price || 0, bill_delay_days: 30, is_shippable: true, product_id: offer.product_id }
      ])
    }
    setShowEditor(true)
  }

  const handleAddNew = () => {
    resetForm()
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Offer name is required')
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        campaign_id: campaignId,
        name: formData.name,
        display_name: formData.display_name || null,
        description: formData.description || null,
        offer_type: formData.offer_type,
        product_id: formData.product_id || null,
        gateway_id: formData.gateway_id || null,
        dynamic_descriptor: formData.dynamic_descriptor || null,
        qty_per_order: formData.qty_per_order,
        price_override: formData.price_override ? parseFloat(formData.price_override) : null,
        ship_price: formData.ship_price ? parseFloat(formData.ship_price) : 0,
        billing_type: formData.billing_type,
        final_billing_cycle: formData.final_billing_cycle ? parseInt(formData.final_billing_cycle) : null,
        fixed_billing_day: formData.fixed_billing_day ? parseInt(formData.fixed_billing_day) : null,
        persistent_rebill_day: formData.persistent_rebill_day,
        stagger_fulfillments: formData.stagger_fulfillments,
        stagger_payments: formData.stagger_payments,
        use_chargeback_protection: formData.use_chargeback_protection,
        delay_fulfillment_on_rebill: formData.delay_fulfillment_on_rebill,
        fulfillment_delay_days: formData.fulfillment_delay_days,
        bill_on_saturday: formData.bill_on_saturday,
        bundle_subscriptions: formData.bundle_subscriptions,
        block_prepaid_cards: formData.block_prepaid_cards,
        stand_alone_transaction: formData.stand_alone_transaction,
        trial_enabled: formData.trial_enabled,
        trial_type: formData.trial_type || null,
        trial_auth_type: formData.trial_auth_type,
        trial_days: formData.trial_days,
        trial_price: formData.trial_price,
        allow_multiple_trials: formData.allow_multiple_trials,
        max_price: formData.max_price ? parseFloat(formData.max_price) : null,
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
        is_active: true,
        position: editingOffer ? editingOffer.position : offers.length,
      }

      let offerId = editingOffer?.id

      if (editingOffer) {
        const { error } = await supabase
          .from('campaign_offers')
          .update(payload as never)
          .eq('id', editingOffer.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('campaign_offers')
          .insert(payload as never)
          .select()
          .single()
        if (error) throw error
        offerId = (data as { id: string }).id
      }

      // Save billing cycles for recurring offers
      if (formData.billing_type === 'recurring' && offerId) {
        // Delete existing cycles
        await supabase.from('offer_billing_cycles').delete().eq('offer_id', offerId)

        // Insert new cycles
        const cyclePayloads = billingCycles.map(cycle => ({
          offer_id: offerId,
          cycle_number: cycle.cycle_number,
          price: cycle.price,
          ship_price: cycle.ship_price,
          bill_delay_days: cycle.bill_delay_days,
          is_shippable: cycle.is_shippable,
          product_id: cycle.product_id || formData.product_id || null,
        }))

        if (cyclePayloads.length > 0) {
          await supabase.from('offer_billing_cycles').insert(cyclePayloads as never)
        }
      }

      toast.success(editingOffer ? 'Offer updated successfully' : 'Offer created successfully')
      setShowEditor(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save offer')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const { error } = await supabase
        .from('campaign_offers')
        .delete()
        .eq('id', offerId)

      if (error) throw error

      toast.success('Offer deleted successfully')
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete offer')
    }
  }

  const addCycle = () => {
    const nextCycle = billingCycles.length + 1
    const lastCycle = billingCycles[billingCycles.length - 1]
    setBillingCycles([
      ...billingCycles,
      {
        cycle_number: nextCycle,
        price: lastCycle?.price || 0,
        ship_price: lastCycle?.ship_price || 0,
        bill_delay_days: lastCycle?.bill_delay_days || 30,
        is_shippable: true,
        product_id: lastCycle?.product_id || formData.product_id || null,
      }
    ])
  }

  const removeCycle = (index: number) => {
    if (billingCycles.length <= 1) return
    const newCycles = billingCycles.filter((_, i) => i !== index)
    // Renumber cycles
    setBillingCycles(newCycles.map((c, i) => ({ ...c, cycle_number: i + 1 })))
  }

  const updateCycle = (index: number, field: keyof BillingCycle, value: string | number | boolean | null) => {
    const newCycles = [...billingCycles]
    newCycles[index] = { ...newCycles[index], [field]: value }
    setBillingCycles(newCycles)
  }

  const formatBillingSchedule = (offer: CampaignOffer & { billing_cycles?: BillingCycle[] }) => {
    if (offer.billing_type === 'one_time' || !offer.billing_cycles?.length) return '---'

    return offer.billing_cycles.map(c => {
      const dayStart = c.cycle_number === 1 ? 1 : (offer.billing_cycles?.slice(0, c.cycle_number - 1).reduce((sum, prev) => sum + prev.bill_delay_days, 0) || 0) + 1
      const dayEnd = dayStart + c.bill_delay_days - 1
      return `Day ${dayStart}-${dayEnd}: $${c.price.toFixed(2)}`
    }).join(', ')
  }

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>
  }

  // Show offer editor
  if (showEditor) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setShowEditor(false); resetForm() }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {editingOffer ? 'Edit Offer' : 'New Offer'}
            </h2>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Offer'}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Product Id</Label>
                <Input value={editingOffer?.display_id?.toString() || 'Auto-generated'} disabled className="bg-muted font-mono" />
              </div>

              <div className="space-y-2">
                <Label>Offer Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Buy 2, Get 1"
                />
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Customer-facing name"
                />
              </div>

              <div className="space-y-2">
                <Label>Base Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(v) => setFormData({ ...formData, product_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gateway Account</Label>
                <Select
                  value={formData.gateway_id}
                  onValueChange={(v) => setFormData({ ...formData, gateway_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {gateways.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.gateway_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <LabelWithTooltip label="Dynamic Descriptor" tooltip="Appears on customer's credit card statement" />
                <Input
                  value={formData.dynamic_descriptor}
                  onChange={(e) => setFormData({ ...formData, dynamic_descriptor: e.target.value })}
                  placeholder="Statement descriptor"
                />
              </div>

              <div className="space-y-2">
                <LabelWithTooltip label="Qty Per Order" tooltip="Quantity included in this offer" />
                <Input
                  type="number"
                  min="1"
                  value={formData.qty_per_order}
                  onChange={(e) => setFormData({ ...formData, qty_per_order: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <LabelWithTooltip label="Block Prepaid Cards" tooltip="Reject prepaid card payments" />
                <Switch
                  checked={formData.block_prepaid_cards}
                  onCheckedChange={(v) => setFormData({ ...formData, block_prepaid_cards: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <LabelWithTooltip label="Stand Alone Transaction" tooltip="Process as separate transaction" />
                <Switch
                  checked={formData.stand_alone_transaction}
                  onCheckedChange={(v) => setFormData({ ...formData, stand_alone_transaction: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Billing Type</Label>
                <Select
                  value={formData.billing_type}
                  onValueChange={(v) => setFormData({ ...formData, billing_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.billing_type === 'recurring' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <LabelWithTooltip label="Final Billing Cycle" tooltip="Stop billing after this cycle (leave empty for infinite)" />
                      <Input
                        type="number"
                        min="1"
                        value={formData.final_billing_cycle}
                        onChange={(e) => setFormData({ ...formData, final_billing_cycle: e.target.value })}
                        placeholder="Infinite"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithTooltip label="Fixed Billing Day" tooltip="Bill on same day each month (1-28)" />
                      <Input
                        type="number"
                        min="1"
                        max="28"
                        value={formData.fixed_billing_day}
                        onChange={(e) => setFormData({ ...formData, fixed_billing_day: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <LabelWithTooltip label="Persistent Rebill Day" tooltip="Keep same billing day" />
                      <Switch
                        checked={formData.persistent_rebill_day}
                        onCheckedChange={(v) => setFormData({ ...formData, persistent_rebill_day: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <LabelWithTooltip label="Stagger Fulfillments?" tooltip="Space out fulfillments" />
                      <Switch
                        checked={formData.stagger_fulfillments}
                        onCheckedChange={(v) => setFormData({ ...formData, stagger_fulfillments: v })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <LabelWithTooltip label="Stagger Payments?" tooltip="Space out payments" />
                      <Switch
                        checked={formData.stagger_payments}
                        onCheckedChange={(v) => setFormData({ ...formData, stagger_payments: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <LabelWithTooltip label="Use Chargeback Protection" tooltip="Enable chargeback protection" />
                      <Switch
                        checked={formData.use_chargeback_protection}
                        onCheckedChange={(v) => setFormData({ ...formData, use_chargeback_protection: v })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <LabelWithTooltip label="Delay Fulfillment on Rebill" tooltip="Delay fulfillment for rebills" />
                    <Switch
                      checked={formData.delay_fulfillment_on_rebill}
                      onCheckedChange={(v) => setFormData({ ...formData, delay_fulfillment_on_rebill: v })}
                    />
                  </div>

                  {formData.delay_fulfillment_on_rebill && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Delay fulfillment by</span>
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={formData.fulfillment_delay_days}
                        onChange={(e) => setFormData({ ...formData, fulfillment_delay_days: parseInt(e.target.value) || 1 })}
                      />
                      <span className="text-sm">days</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <LabelWithTooltip label="Bill On Saturday?" tooltip="Allow billing on Saturdays" />
                      <Switch
                        checked={formData.bill_on_saturday}
                        onCheckedChange={(v) => setFormData({ ...formData, bill_on_saturday: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <LabelWithTooltip label="Bundle Subscriptions" tooltip="Bundle multiple subscriptions together" />
                      <Switch
                        checked={formData.bundle_subscriptions}
                        onCheckedChange={(v) => setFormData({ ...formData, bundle_subscriptions: v })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Trial Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Trial Options
                <Info className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Trial Enabled</Label>
                <Switch
                  checked={formData.trial_enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, trial_enabled: v })}
                />
              </div>

              {formData.trial_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Trial Type</Label>
                    <Select
                      value={formData.trial_type}
                      onValueChange={(v) => setFormData({ ...formData, trial_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trial type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIAL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip label="Trial Auth Type" tooltip="Authorization type for trial" />
                    <Select
                      value={formData.trial_auth_type}
                      onValueChange={(v) => setFormData({ ...formData, trial_auth_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIAL_AUTH_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trial Days</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.trial_days}
                        onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trial Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.trial_price}
                        onChange={(e) => setFormData({ ...formData, trial_price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <LabelWithTooltip label="Allow Multiple Trials" tooltip="Allow customer to purchase trial multiple times" />
                    <Switch
                      checked={formData.allow_multiple_trials}
                      onCheckedChange={(v) => setFormData({ ...formData, allow_multiple_trials: v })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Max Price</Label>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1.5 bg-muted rounded-l-md border border-r-0 text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded-l-none"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cycle by Cycle - Only for recurring */}
        {formData.billing_type === 'recurring' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Cycle by Cycle
                <Info className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {billingCycles.map((cycle, index) => {
                const dayStart = index === 0 ? 1 : billingCycles.slice(0, index).reduce((sum, c) => sum + c.bill_delay_days, 0) + 1
                const dayEnd = dayStart + cycle.bill_delay_days - 1

                return (
                  <Card key={index} className="bg-muted/30">
                    <CardHeader className="py-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">
                        Cycle {cycle.cycle_number}
                        {index === billingCycles.length - 1 && billingCycles.length > 1 && '+'}
                      </CardTitle>
                      {billingCycles.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeCycle(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1.5 bg-background rounded-l-md border border-r-0 text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="rounded-l-none"
                            value={cycle.price}
                            onChange={(e) => updateCycle(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <LabelWithTooltip label="Ship Price" tooltip="Shipping cost for this cycle" />
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1.5 bg-background rounded-l-md border border-r-0 text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="rounded-l-none"
                            value={cycle.ship_price}
                            onChange={(e) => updateCycle(index, 'ship_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Bill Delay (days)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={cycle.bill_delay_days}
                          onChange={(e) => updateCycle(index, 'bill_delay_days', parseInt(e.target.value) || 30)}
                        />
                        <p className="text-xs text-muted-foreground">
                          (Days {dayStart} to {dayEnd})
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Shippable</Label>
                        <div className="pt-2">
                          <Switch
                            checked={cycle.is_shippable}
                            onCheckedChange={(v) => updateCycle(index, 'is_shippable', v)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <LabelWithTooltip label="Base Product" tooltip="Product for this cycle" />
                        <Select
                          value={cycle.product_id || formData.product_id || ''}
                          onValueChange={(v) => updateCycle(index, 'product_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Same as offer" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <Button onClick={addCycle} variant="default" className="bg-red-500 hover:bg-red-600">
                <Plus className="mr-2 h-4 w-4" />
                Add New Cycle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Show offers list
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Offers ({offers.length} Products)</CardTitle>
        <div className="flex items-center gap-2">
          <Select defaultValue="live">
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live Offers</SelectItem>
              <SelectItem value="all">All Offers</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Offer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No offers yet. Click &quot;Add Offer&quot; to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Campaign Product Id</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Shipping</TableHead>
                <TableHead>Billing Schedule</TableHead>
                <TableHead>Trial Type</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer, index) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {offer.display_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {offer.display_name || offer.name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {offer.gateway ? (
                      <span>{offer.gateway.name}</span>
                    ) : '---'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${(offer.price_override || offer.product?.price || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {offer.ship_price ? `$${offer.ship_price.toFixed(2)}` : '---'}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px]">
                    <div className="truncate" title={formatBillingSchedule(offer)}>
                      {formatBillingSchedule(offer)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {offer.trial_enabled ? (
                      <Badge variant="outline">{offer.trial_type || 'Trial'}</Badge>
                    ) : '---'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8 bg-blue-500 hover:bg-blue-600"
                        onClick={() => handleEdit(offer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(offer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
