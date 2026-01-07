'use client'

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { CampaignFormData } from '../campaign-form'
import type { CampaignCategory } from '@/types/database'

interface GeneralDetailsSectionProps {
  form: UseFormReturn<CampaignFormData>
  campaignId?: string
  displayId?: number
  categories?: CampaignCategory[]
}

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
]

const CAMPAIGN_TYPES = [
  { value: 'phone', label: 'PHONE' },
  { value: 'web', label: 'WEB' },
  { value: 'retail', label: 'RETAIL' },
  { value: 'wholesale', label: 'WHOLESALE' },
]

const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'text-gray-500' },
  { value: 'active', label: 'Active', color: 'text-green-600' },
  { value: 'paused', label: 'Paused', color: 'text-yellow-600' },
  { value: 'completed', label: 'Completed', color: 'text-blue-600' },
  { value: 'archived', label: 'Archived', color: 'text-gray-400' },
]

function LabelWithTooltip({ label, tooltip, className = '' }: { label: string; tooltip: string; className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span>{label}</span>
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

export function GeneralDetailsSection({ form, campaignId, displayId, categories = [] }: GeneralDetailsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header Fields */}
      <div className="space-y-6">
        {/* ID, Name, Type, Category, Currency, Status - Row 1 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-[80px_1fr_120px_minmax(150px,1fr)_160px_140px]">
          <div className="space-y-2">
            <label className="text-sm font-medium">ID</label>
            <Input
              value={displayId ? String(displayId) : (campaignId ? 'New' : 'New')}
              disabled
              className="font-mono bg-muted"
            />
          </div>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Campaign name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="campaign_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((type) => (
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Campaign description (optional)"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Options Grid - 4 Columns */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Basic Options */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-blue-600">Basic Options</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="list_in_order_entry"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="List in Order Entry"
                    tooltip="Show this campaign in the order entry dropdown"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quality_assurance"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Quality Assurance"
                    tooltip="Enable QA review for orders"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="must_agree_tos"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Must Agree to ToS"
                    tooltip="Require terms acceptance"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Billing Options */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-red-500">Billing Options</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="preauth_only"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Preauth Only"
                    tooltip="Only authorize, don't capture"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="route_to_pinless_debit"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Route to Pinless Debit"
                    tooltip="Route debit through pinless network"
                    className="text-sm text-red-500"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accept_cod"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Accept Cash on Delivery"
                    tooltip="Allow COD payments"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="retail_orders"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Retail Orders"
                    tooltip="Enable retail processing"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_prepaid"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Block Prepaid Cards"
                    tooltip="Block prepaid cards"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_debit"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Block Debit Cards"
                    tooltip="Block debit cards"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_mastercard"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Block Mastercard"
                    tooltip="Block Mastercard"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_visa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Block Visa"
                    tooltip="Block Visa cards"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_amex"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Block AmEx"
                    tooltip="Block American Express"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_discover"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Block Discover"
                    tooltip="Block Discover cards"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Shipping Options */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-green-600">Shipping Options</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="capture_on_shipment"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Capture on Shipment"
                    tooltip="Capture when shipped"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bundle_fulfillment"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Bundle Fulfillment"
                    tooltip="Bundle items in one shipment"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fulfillment_delay_hours"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <span className="text-sm">Delay (Hours)</span>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">Hours</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Other Options */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-orange-500">Other Options</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="screen_with_fraud_manager"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Screen with Fraud Manager?"
                    tooltip="Run fraud detection"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chargeback_blacklist"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <LabelWithTooltip
                    label="Chargeback Blacklist"
                    tooltip="Blacklist chargeback customers"
                    className="text-sm"
                  />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_total_value"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <LabelWithTooltip
                    label="Maximum Total Value"
                    tooltip="Max order value"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium px-2 py-1.5 bg-muted rounded-l-md border border-r-0">$</span>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 rounded-l-none"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="min_total_value"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <LabelWithTooltip
                    label="Minimum Total Value"
                    tooltip="Min order value"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium px-2 py-1.5 bg-muted rounded-l-md border border-r-0">$</span>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 rounded-l-none"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_coupons"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <LabelWithTooltip
                    label="Maximum Coupons"
                    tooltip="Max coupons per order"
                    className="text-sm"
                  />
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      className="w-20"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorder_days"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <LabelWithTooltip
                    label="Reorder Days"
                    tooltip="Days before reorder"
                    className="text-sm"
                  />
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      className="w-20"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
