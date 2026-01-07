'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Gateway } from '@/types/database'
import { GATEWAY_TYPES, CARD_TYPES, CURRENCIES } from '@/lib/spreedly/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const gatewaySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  spreedly_gateway_token: z.string(),
  gateway_type: z.string().min(1, 'Gateway type is required'),
  is_active: z.boolean(),
  priority: z.string(),
  monthly_cap: z.string().optional(),
  accepted_currencies: z.array(z.string()).min(1, 'Select at least one currency'),
  accepted_card_types: z.array(z.string()).min(1, 'Select at least one card type'),
  min_amount: z.string().optional(),
  max_amount: z.string().optional(),
  descriptor: z.string().optional(),
}).refine((data) => {
  // Spreedly token is optional for demo gateway
  if (data.gateway_type === 'demo') {
    return true
  }
  return data.spreedly_gateway_token.length > 0
}, {
  message: 'Spreedly token is required for non-demo gateways',
  path: ['spreedly_gateway_token'],
})

type GatewayFormData = z.infer<typeof gatewaySchema>

interface GatewayFormProps {
  gateway?: Gateway
  organizationId: string
}

export function GatewayForm({ gateway, organizationId }: GatewayFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!gateway

  const form = useForm<GatewayFormData>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      name: gateway?.name || '',
      spreedly_gateway_token: gateway?.spreedly_gateway_token || '',
      gateway_type: gateway?.gateway_type || '',
      is_active: gateway?.is_active ?? true,
      priority: gateway?.priority?.toString() || '0',
      monthly_cap: gateway?.monthly_cap?.toString() || '',
      accepted_currencies: gateway?.accepted_currencies || ['USD'],
      accepted_card_types: gateway?.accepted_card_types || ['visa', 'mastercard', 'amex'],
      min_amount: gateway?.min_amount?.toString() || '',
      max_amount: gateway?.max_amount?.toString() || '',
      descriptor: gateway?.descriptor || '',
    },
  })

  // Watch gateway type to auto-fill demo token
  const watchedGatewayType = form.watch('gateway_type')
  const isDemoGateway = watchedGatewayType === 'demo'

  // Auto-fill demo token when demo gateway is selected
  const handleGatewayTypeChange = (value: string) => {
    form.setValue('gateway_type', value)
    if (value === 'demo') {
      form.setValue('spreedly_gateway_token', 'DEMO_GATEWAY')
      form.setValue('name', form.getValues('name') || 'Demo Gateway')
    } else if (form.getValues('spreedly_gateway_token') === 'DEMO_GATEWAY') {
      form.setValue('spreedly_gateway_token', '')
    }
  }

  const onSubmit = async (data: GatewayFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        spreedly_gateway_token: data.spreedly_gateway_token,
        gateway_type: data.gateway_type,
        is_active: data.is_active,
        priority: parseInt(data.priority),
        monthly_cap: data.monthly_cap ? parseFloat(data.monthly_cap) : null,
        accepted_currencies: data.accepted_currencies,
        accepted_card_types: data.accepted_card_types,
        min_amount: data.min_amount ? parseFloat(data.min_amount) : null,
        max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
        descriptor: data.descriptor || null,
        organization_id: organizationId, // Add organization_id for multi-tenant support
      }

      if (isEditing) {
        const { error } = await supabase
          .from('gateways')
          .update(payload as never)
          .eq('id', gateway.id)

        if (error) throw error
        toast.success('Gateway updated successfully')
      } else {
        const { error } = await supabase.from('gateways').insert(payload as never)

        if (error) throw error
        toast.success('Gateway created successfully')
      }

      router.push('/gateways')
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(isEditing ? 'Failed to update gateway' : 'Failed to create gateway', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gateway Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Stripe Gateway" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this gateway
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gateway_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gateway Type *</FormLabel>
                    <Select
                      onValueChange={handleGatewayTypeChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gateway type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GATEWAY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div>{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isDemoGateway && (
                      <FormDescription className="text-amber-600">
                        Demo gateway simulates payments. Set DEMO_MODE=true in .env.local
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spreedly_gateway_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isDemoGateway ? 'Gateway Token' : 'Spreedly Gateway Token *'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isDemoGateway ? 'Auto-filled for demo' : 'Gateway token from Spreedly'}
                        {...field}
                        disabled={isDemoGateway}
                        className={isDemoGateway ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {isDemoGateway
                        ? 'Demo gateway token is auto-filled'
                        : 'Get this from your Spreedly dashboard'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Higher priority gateways are tried first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable this gateway for processing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routing Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="monthly_cap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Volume Cap</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="No cap"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Max monthly processing volume
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Transaction Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="No minimum"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Transaction Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="No maximum"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descriptor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statement Descriptor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MYCOMPANY"
                      maxLength={22}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Appears on customer bank statements (max 22 chars)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accepted_currencies"
              render={() => (
                <FormItem>
                  <FormLabel>Accepted Currencies *</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {CURRENCIES.map((currency) => (
                      <FormField
                        key={currency.value}
                        control={form.control}
                        name="accepted_currencies"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(currency.value)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...field.value, currency.value]
                                    : field.value.filter(
                                        (v) => v !== currency.value
                                      )
                                  field.onChange(updated)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {currency.value}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accepted_card_types"
              render={() => (
                <FormItem>
                  <FormLabel>Accepted Card Types *</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {CARD_TYPES.map((cardType) => (
                      <FormField
                        key={cardType.value}
                        control={form.control}
                        name="accepted_card_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(cardType.value)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...field.value, cardType.value]
                                    : field.value.filter(
                                        (v) => v !== cardType.value
                                      )
                                  field.onChange(updated)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {cardType.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
              ? 'Update Gateway'
              : 'Create Gateway'}
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
