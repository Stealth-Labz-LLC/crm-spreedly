import { createServiceClient } from '@/lib/supabase/server'
import type { Product, ProductCategory } from '@/types/database'
import { ProductsClient } from './products-client'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    sku?: string
    tag?: string
    status?: string
    fulfillment_type?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createServiceClient()

  // Build query with filters
  let query = supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }
  if (params.sku) {
    query = query.ilike('sku', `%${params.sku}%`)
  }
  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.tag) {
    query = query.contains('tags', [params.tag])
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.fulfillment_type && params.fulfillment_type !== 'all') {
    query = query.eq('fulfillment_type', params.fulfillment_type)
  }

  const { data: productsData } = await query
  const products = (productsData || []) as Product[]

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('product_categories')
    .select('*')
    .order('sort_order')

  const categories = (categoriesData || []) as ProductCategory[]

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  return (
    <ProductsClient
      products={products}
      groupedProducts={groupedProducts}
      categories={categories}
      filters={params}
    />
  )
}
