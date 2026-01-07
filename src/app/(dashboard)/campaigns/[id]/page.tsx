import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params
  // Redirect to edit page - campaigns are always in edit mode
  redirect(`/campaigns/${id}/edit`)
}
