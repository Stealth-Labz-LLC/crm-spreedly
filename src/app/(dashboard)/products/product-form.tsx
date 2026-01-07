'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Product, ProductCategory } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']),
  category: z.string().optional(),
  tags: z.string().optional(),
  billing_type: z.enum(['onetime', 'subscription']),
  price: z.string().min(1, 'Price is required'),
  currency: z.string(),
  billing_interval: z.enum(['day', 'week', 'month', 'year']).optional().nullable(),
  billing_interval_count: z.string().optional(),
  trial_days: z.string().optional(),
  setup_fee: z.string().optional(),
  fulfillment_type: z.string(),
  fulfillment_delay_hours: z.string().optional(),
  qty_per_order: z.string(),
  product_cost: z.string().optional(),
  shipping_cost: z.string().optional(),
  weight: z.string().optional(),
  qty_available: z.string().optional(),
  msrp: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  defaultCategory?: string
}

const FULFILLMENT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'digital', label: 'Digital Delivery' },
  { value: 'dropship', label: 'Dropship' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'no_shipping', label: 'No Shipping' },
]

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      {label}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export function ProductForm({ product, defaultCategory }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!product

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order')
      if (data) setCategories(data as ProductCategory[])
    }
    fetchCategories()
  }, [supabase])

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      status: (product?.status as 'active' | 'inactive' | 'archived') || 'active',
      category: product?.category || defaultCategory || '',
      tags: product?.tags?.join(', ') || '',
      billing_type: (product?.billing_type as 'onetime' | 'subscription') || 'onetime',
      price: product?.price?.toString() || '',
      currency: product?.currency || 'USD',
      billing_interval: product?.billing_interval as 'day' | 'week' | 'month' | 'year' | undefined,
      billing_interval_count: product?.billing_interval_count?.toString() || '1',
      trial_days: product?.trial_days?.toString() || '0',
      setup_fee: product?.setup_fee?.toString() || '0',
      fulfillment_type: product?.fulfillment_type || 'standard',
      fulfillment_delay_hours: product?.fulfillment_delay_hours?.toString() || '0',
      qty_per_order: product?.qty_per_order?.toString() || '1',
      product_cost: product?.product_cost?.toString() || '0',
      shipping_cost: product?.shipping_cost?.toString() || '0',
      weight: product?.weight?.toString() || '',
      qty_available: product?.qty_available?.toString() || '0',
      msrp: product?.msrp?.toString() || '',
    },
  })

  const billingType = form.watch('billing_type')

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        sku: data.sku || null,
        description: data.description || null,
        status: data.status,
        category: data.category || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        billing_type: data.billing_type,
        price: parseFloat(data.price),
        currency: data.currency,
        billing_interval: data.billing_type === 'subscription' ? data.billing_interval : null,
        billing_interval_count: data.billing_type === 'subscription'
          ? parseInt(data.billing_interval_count || '1')
          : 1,
        trial_days: parseInt(data.trial_days || '0'),
        setup_fee: parseFloat(data.setup_fee || '0'),
        fulfillment_type: data.fulfillment_type,
        fulfillment_delay_hours: parseInt(data.fulfillment_delay_hours || '0'),
        qty_per_order: parseInt(data.qty_per_order || '1'),
        product_cost: parseFloat(data.product_cost || '0'),
        shipping_cost: parseFloat(data.shipping_cost || '0'),
        weight: data.weight ? parseFloat(data.weight) : null,
        qty_available: parseInt(data.qty_available || '0'),
        msrp: data.msrp ? parseFloat(data.msrp) : null,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(payload as never)
          .eq('id', product.id)

        if (error) throw error
        toast.success('Product updated successfully')
      } else {
        const { error } = await supabase.from('products').insert(payload as never)

        if (error) throw error
        toast.success('Product created successfully')
      }

      router.push('/products')
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - General Details */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">General Details</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <LabelWithTooltip
                      label="Product SKU"
                      tooltip="Stock Keeping Unit - A unique identifier for inventory management"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="SKU-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <LabelWithTooltip
                      label="Tags"
                      tooltip="Comma-separated tags for organizing products"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="tag1, tag2, tag3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column - Fulfillment & Pricing */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Fulfillment Details</h2>

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="fulfillment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fulfillment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FULFILLMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qty_per_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="Qty Per Order"
                        tooltip="Default quantity added to cart"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="fulfillment_delay_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="Fulfillment Delay"
                        tooltip="Hours to wait before fulfillment"
                      />
                    </FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="rounded-r-none"
                          {...field}
                        />
                      </FormControl>
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-sm text-muted-foreground">
                        Hours
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="Product Cost"
                        tooltip="Your cost for this product"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="shipping_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="Shipping Cost"
                        tooltip="Default shipping cost"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="Weight (lbs)"
                        tooltip="Product weight for shipping calculations"
                      />
                    </FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="rounded-r-none"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-sm text-muted-foreground">
                        lbs
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="qty_available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="Qty Available"
                        tooltip="Current inventory quantity"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="msrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <LabelWithTooltip
                        label="MSRP"
                        tooltip="Manufacturer Suggested Retail Price"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing Section */}
            <h2 className="text-lg font-semibold border-b pb-2 pt-4">Pricing</h2>

            <FormField
              control={form.control}
              name="billing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select billing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="onetime">One-time Purchase</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {billingType === 'subscription' && (
              <>
                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Interval</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="day">Daily</SelectItem>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                            <SelectItem value="year">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_interval_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interval Count</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          e.g., 2 = every 2 months
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="trial_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Days</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="setup_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
              ? 'Update Product'
              : 'Create Product'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
