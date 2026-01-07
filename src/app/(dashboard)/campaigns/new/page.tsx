import { CampaignForm } from '@/components/campaigns/campaign-form'
import { getOrganizationContext } from '@/lib/auth/organization-context'

export default async function NewCampaignPage() {
  const { organization } = await getOrganizationContext()
  return <CampaignForm organizationId={organization.id} />
}
