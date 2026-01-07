'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Campaign, CampaignCategory } from '@/types/database'
import { Form } from '@/components/ui/form'
import { toast } from 'sonner'
import { CampaignLayout, CAMPAIGN_SECTIONS, CampaignSectionId } from './campaign-layout'
import { GeneralDetailsSection } from './sections/general-details'
import { CountriesSection } from './sections/countries'
import { OffersSection } from './sections/offers'
import { UpsellsSection } from './sections/upsells'
import { SalesTaxSection } from './sections/sales-tax'
import { CouponsSection } from './sections/coupons'
import { ShippingSection } from './sections/shipping'
import { SurchargeSection } from './sections/surcharge'
import { ScriptsSection } from './sections/scripts'
import { CallCentersSection } from './sections/call-centers'
import { EmailSection } from './sections/email'
import { SmsSection } from './sections/sms'
import { CustomFieldsSection } from './sections/custom-fields'
import { TermsOfServiceSection } from './sections/terms-of-service'
import { BlockedBinsSection } from './sections/blocked-bins'

// Zod schema for campaign form
const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
  campaign_type: z.enum(['phone', 'web', 'retail', 'wholesale']),
  category: z.string().nullable().optional(),
  currency: z.string(),

  // Basic Options
  list_in_order_entry: z.boolean(),
  quality_assurance: z.boolean(),
  must_agree_tos: z.boolean(),

  // Billing Options
  preauth_only: z.boolean(),
  route_to_pinless_debit: z.boolean(),
  accept_cod: z.boolean(),
  retail_orders: z.boolean(),

  // Card Blocking
  block_prepaid: z.boolean(),
  block_debit: z.boolean(),
  block_visa: z.boolean(),
  block_mastercard: z.boolean(),
  block_amex: z.boolean(),
  block_discover: z.boolean(),

  // Shipping Options
  capture_on_shipment: z.boolean(),
  bundle_fulfillment: z.boolean(),
  fulfillment_delay_hours: z.number(),

  // Other Options
  screen_with_fraud_manager: z.boolean(),
  chargeback_blacklist: z.boolean(),
  max_total_value: z.number(),
  min_total_value: z.number(),
  max_coupons: z.number(),
  reorder_days: z.number(),
})

export type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignFormProps {
  campaign?: Campaign | null
}

export function CampaignForm({ campaign }: CampaignFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeSection, setActiveSection] = useState<CampaignSectionId>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(campaign?.id || null)
  const [categories, setCategories] = useState<CampaignCategory[]>([])

  const isEditing = !!campaign

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('campaign_categories')
        .select('*')
        .order('name')
      if (data) {
        setCategories(data as CampaignCategory[])
      }
    }
    fetchCategories()
  }, [supabase])

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || '',
      description: campaign?.description || '',
      status: (campaign?.status as CampaignFormData['status']) || 'draft',
      campaign_type: (campaign?.campaign_type as CampaignFormData['campaign_type']) || 'web',
      category: campaign?.category || '',
      currency: campaign?.currency || 'USD',

      // Basic Options
      list_in_order_entry: campaign?.list_in_order_entry ?? true,
      quality_assurance: campaign?.quality_assurance ?? false,
      must_agree_tos: campaign?.must_agree_tos ?? false,

      // Billing Options
      preauth_only: campaign?.preauth_only ?? false,
      route_to_pinless_debit: campaign?.route_to_pinless_debit ?? false,
      accept_cod: campaign?.accept_cod ?? false,
      retail_orders: campaign?.retail_orders ?? false,

      // Card Blocking
      block_prepaid: campaign?.block_prepaid ?? false,
      block_debit: campaign?.block_debit ?? false,
      block_visa: campaign?.block_visa ?? false,
      block_mastercard: campaign?.block_mastercard ?? false,
      block_amex: campaign?.block_amex ?? false,
      block_discover: campaign?.block_discover ?? false,

      // Shipping Options
      capture_on_shipment: campaign?.capture_on_shipment ?? false,
      bundle_fulfillment: campaign?.bundle_fulfillment ?? false,
      fulfillment_delay_hours: campaign?.fulfillment_delay_hours ?? 24,

      // Other Options
      screen_with_fraud_manager: campaign?.screen_with_fraud_manager ?? false,
      chargeback_blacklist: campaign?.chargeback_blacklist ?? false,
      max_total_value: campaign?.max_total_value ?? 0,
      min_total_value: campaign?.min_total_value ?? 0,
      max_coupons: campaign?.max_coupons ?? 1,
      reorder_days: campaign?.reorder_days ?? 0,
    },
  })

  const isDirty = form.formState.isDirty

  const handleSave = async () => {
    // Validate general details form first
    const isValid = await form.trigger()
    if (!isValid) {
      setActiveSection('general')
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSaving(true)
    try {
      const data = form.getValues()

      const payload = {
        name: data.name,
        description: data.description || null,
        status: data.status,
        campaign_type: data.campaign_type,
        category: data.category || null,
        currency: data.currency,

        list_in_order_entry: data.list_in_order_entry,
        quality_assurance: data.quality_assurance,
        must_agree_tos: data.must_agree_tos,

        preauth_only: data.preauth_only,
        route_to_pinless_debit: data.route_to_pinless_debit,
        accept_cod: data.accept_cod,
        retail_orders: data.retail_orders,

        block_prepaid: data.block_prepaid,
        block_debit: data.block_debit,
        block_visa: data.block_visa,
        block_mastercard: data.block_mastercard,
        block_amex: data.block_amex,
        block_discover: data.block_discover,

        capture_on_shipment: data.capture_on_shipment,
        bundle_fulfillment: data.bundle_fulfillment,
        fulfillment_delay_hours: data.fulfillment_delay_hours,

        screen_with_fraud_manager: data.screen_with_fraud_manager,
        chargeback_blacklist: data.chargeback_blacklist,
        max_total_value: data.max_total_value,
        min_total_value: data.min_total_value,
        max_coupons: data.max_coupons,
        reorder_days: data.reorder_days,
      }

      if (isEditing && campaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(payload as never)
          .eq('id', campaign.id)

        if (error) throw error
        toast.success('Campaign updated successfully')
        form.reset(data)
        router.refresh()
      } else {
        const { data: newCampaign, error } = await supabase
          .from('campaigns')
          .insert(payload as never)
          .select()
          .single()

        if (error) throw error
        toast.success('Campaign created successfully')
        const createdCampaign = newCampaign as { id: string }
        setCampaignId(createdCampaign.id)
        router.replace(`/campaigns/${createdCampaign.id}/edit`)
        router.refresh()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(isEditing ? 'Failed to update campaign' : 'Failed to create campaign', {
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderSection = () => {
    // For sections other than general, we need a campaign ID
    const needsCampaignId = activeSection !== 'general'
    const currentCampaignId = campaignId || campaign?.id

    if (needsCampaignId && !currentCampaignId) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Please save the campaign first to configure {activeSection.replace('-', ' ')}.
          </p>
        </div>
      )
    }

    switch (activeSection) {
      case 'general':
        return <GeneralDetailsSection form={form} campaignId={currentCampaignId || undefined} displayId={campaign?.display_id} categories={categories} />
      case 'countries':
        return <CountriesSection campaignId={currentCampaignId!} />
      case 'offers':
        return <OffersSection campaignId={currentCampaignId!} />
      case 'upsells':
        return <UpsellsSection campaignId={currentCampaignId!} />
      case 'sales-tax':
        return <SalesTaxSection campaignId={currentCampaignId!} />
      case 'coupons':
        return <CouponsSection campaignId={currentCampaignId!} />
      case 'shipping':
        return <ShippingSection campaignId={currentCampaignId!} />
      case 'surcharge':
        return <SurchargeSection campaignId={currentCampaignId!} />
      case 'scripts':
        return <ScriptsSection campaignId={currentCampaignId!} />
      case 'call-centers':
        return <CallCentersSection campaignId={currentCampaignId!} />
      case 'email':
        return <EmailSection campaignId={currentCampaignId!} />
      case 'sms':
        return <SmsSection campaignId={currentCampaignId!} />
      case 'custom-fields':
        return <CustomFieldsSection campaignId={currentCampaignId!} />
      case 'terms-of-service':
        return <TermsOfServiceSection campaignId={currentCampaignId!} />
      case 'blocked-bins':
        return <BlockedBinsSection campaignId={currentCampaignId!} />
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <CampaignLayout
        campaign={campaign || null}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
      >
        {renderSection()}
      </CampaignLayout>
    </Form>
  )
}
