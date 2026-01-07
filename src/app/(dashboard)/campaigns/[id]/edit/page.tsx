import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'
import { CampaignForm } from '@/components/campaigns/campaign-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCampaignPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    notFound()
  }

  return <CampaignForm campaign={campaign as Campaign} />
}
