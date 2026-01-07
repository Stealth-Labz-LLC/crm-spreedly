import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProductForm } from '../product-form'

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function NewProductPage({ searchParams }: PageProps) {
  const params = await searchParams
  const defaultCategory = params.category || ''

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ADD PRODUCT</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Link href="/products" className="hover:text-foreground">
              CRM
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-foreground">
              Products
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Add Product</span>
          </div>
        </div>
      </div>

      {/* Form - Full width */}
      <ProductForm defaultCategory={defaultCategory} />
    </div>
  )
}
