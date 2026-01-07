import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '../customer-form'

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground">
            Add a new customer to your database
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CustomerForm />
      </div>
    </div>
  )
}
