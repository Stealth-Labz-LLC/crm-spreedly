import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { ChevronRight } from 'lucide-react'
import { ProductForm } from '../../product-form'
import type { Product } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) {
    notFound()
  }

  const product = data as Product

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">EDIT PRODUCT</h1>
          <p className="text-muted-foreground">{product.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Link href="/products" className="hover:text-foreground">
              CRM
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-foreground">
              Products
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Edit Product</span>
          </div>
        </div>
      </div>

      {/* Form - Full width */}
      <ProductForm product={product} />
    </div>
  )
}
