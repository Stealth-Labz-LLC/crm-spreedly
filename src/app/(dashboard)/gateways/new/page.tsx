import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GatewayForm } from '../gateway-form'
import { getOrganizationContext } from '@/lib/auth/organization-context'

export default async function NewGatewayPage() {
  const { organization } = await getOrganizationContext()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/gateways">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Gateway</h1>
          <p className="text-muted-foreground">
            Configure a new payment gateway
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <GatewayForm organizationId={organization.id} />
      </div>
    </div>
  )
}
