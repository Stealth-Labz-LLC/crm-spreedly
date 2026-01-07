'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductCategory } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Filter,
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react'
import { ProductActions } from './product-actions'
import { toast } from 'sonner'

interface ProductsClientProps {
  products: Product[]
  groupedProducts: Record<string, Product[]>
  categories: ProductCategory[]
  filters: {
    search?: string
    category?: string
    sku?: string
    tag?: string
    status?: string
    fulfillment_type?: string
  }
}

const FULFILLMENT_TYPES = [
  { value: 'all', label: 'All Fulfillment Types' },
  { value: 'standard', label: 'Standard' },
  { value: 'digital', label: 'Digital Delivery' },
  { value: 'dropship', label: 'Dropship' },
  { value: 'warehouse', label: 'Warehouse' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'active', label: 'Active Products' },
  { value: 'inactive', label: 'Inactive Products' },
  { value: 'archived', label: 'Archived Products' },
]

export function ProductsClient({
  products,
  groupedProducts,
  categories,
  filters,
}: ProductsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showFilters, setShowFilters] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(groupedProducts))
  )
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // Filter form state
  const [filterName, setFilterName] = useState(filters.search || '')
  const [filterSku, setFilterSku] = useState(filters.sku || '')
  const [filterCategory, setFilterCategory] = useState(filters.category || 'all')
  const [filterTag, setFilterTag] = useState(filters.tag || '')
  const [filterStatus, setFilterStatus] = useState(filters.status || 'all')
  const [filterFulfillment, setFilterFulfillment] = useState(
    filters.fulfillment_type || 'all'
  )

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (filterName) params.set('search', filterName)
    if (filterSku) params.set('sku', filterSku)
    if (filterCategory && filterCategory !== 'all') params.set('category', filterCategory)
    if (filterTag) params.set('tag', filterTag)
    if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus)
    if (filterFulfillment && filterFulfillment !== 'all')
      params.set('fulfillment_type', filterFulfillment)

    router.push(`/products?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setFilterName('')
    setFilterSku('')
    setFilterCategory('all')
    setFilterTag('')
    setFilterStatus('all')
    setFilterFulfillment('all')
    router.push('/products')
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsCreatingCategory(true)
    try {
      const { error } = await supabase.from('product_categories').insert({
        name: newCategoryName.trim(),
        sort_order: categories.length + 1,
      } as never)

      if (error) throw error

      toast.success('Category created successfully')
      setCategoryDialogOpen(false)
      setNewCategoryName('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to create category')
      console.error(error)
    } finally {
      setIsCreatingCategory(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PRODUCTS</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>CRM</span>
            <ChevronRight className="h-4 w-4" />
            <span>Products</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new product category to organize your products.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                >
                  {isCreatingCategory ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="filterName">Name</Label>
                  <Input
                    id="filterName"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Search by name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterSku">SKU</Label>
                  <Input
                    id="filterSku"
                    value={filterSku}
                    onChange={(e) => setFilterSku(e.target.value)}
                    placeholder="Search by SKU..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterTag">Tag</Label>
                  <Input
                    id="filterTag"
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    placeholder="Search by tag..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fulfillment Type</Label>
                  <Select
                    value={filterFulfillment}
                    onValueChange={setFilterFulfillment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Fulfillment Types" />
                    </SelectTrigger>
                    <SelectContent>
                      {FULFILLMENT_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSearch}>Search Products</Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Products by Category */}
      {Object.keys(groupedProducts).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No products found</p>
            <Link href="/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add your first product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <Card key={category}>
            <Collapsible
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 hover:opacity-80">
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <span className="text-lg font-semibold">{category}</span>
                      <Badge variant="secondary" className="ml-2">
                        {categoryProducts.length} Products
                      </Badge>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Link href={`/products/new?category=${encodeURIComponent(category)}`}>
                      <Button size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Fulfillment</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">MSRP</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryProducts.map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/products/${product.id}`}
                              className="font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                            {product.billing_type === 'subscription' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Subscription
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {product.fulfillment_type || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.sku || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.msrp
                              ? `$${Number(product.msrp).toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${Number(product.price).toFixed(2)}
                            {product.billing_type === 'subscription' && (
                              <span className="text-muted-foreground text-xs">
                                /{product.billing_interval}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.status === 'active'
                                  ? 'default'
                                  : product.status === 'inactive'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ProductActions product={product} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))
      )}

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {products.length} product{products.length !== 1 ? 's' : ''} in{' '}
        {Object.keys(groupedProducts).length} categor
        {Object.keys(groupedProducts).length !== 1 ? 'ies' : 'y'}
      </div>
    </div>
  )
}
