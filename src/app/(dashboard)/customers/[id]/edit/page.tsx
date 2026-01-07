import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { CustomerForm } from '../../customer-form'
import type { Customer } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) {
    notFound()
  }

  const customer = data as Customer

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CustomerForm customer={customer} />
      </div>
    </div>
  )
}
