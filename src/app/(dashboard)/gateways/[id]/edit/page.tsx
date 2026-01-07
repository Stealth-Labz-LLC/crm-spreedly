import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/auth/organization-context'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { GatewayForm } from '../../gateway-form'
import type { Gateway } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditGatewayPage({ params }: PageProps) {
  const { id } = await params
  const { organization } = await getOrganizationContext()
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('gateways')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) {
    notFound()
  }

  const gateway = data as Gateway

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/gateways/${id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Gateway</h1>
          <p className="text-muted-foreground">{gateway.name}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <GatewayForm gateway={gateway} organizationId={organization.id} />
      </div>
    </div>
  )
}
