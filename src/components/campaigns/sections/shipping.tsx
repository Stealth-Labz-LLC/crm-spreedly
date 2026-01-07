'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignShippingOption } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'

interface ShippingSectionProps {
  campaignId: string
}

export function ShippingSection({ campaignId }: ShippingSectionProps) {
  const supabase = createClient()
  const [options, setOptions] = useState<CampaignShippingOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<CampaignShippingOption | null>(null)
  const [formData, setFormData] = useState({
    name: '', carrier: '', method: '', base_cost: '', per_item_cost: '', free_threshold: '', estimated_days_min: '', estimated_days_max: ''
  })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_shipping_options').select('*').eq('campaign_id', campaignId).order('position')
    setOptions(data || [])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({ name: '', carrier: '', method: '', base_cost: '', per_item_cost: '', free_threshold: '', estimated_days_min: '', estimated_days_max: '' })
    setEditingOption(null)
  }

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name required'); return }
    const payload = {
      campaign_id: campaignId, name: formData.name, carrier: formData.carrier || null, method: formData.method || null,
      base_cost: parseFloat(formData.base_cost) || 0, per_item_cost: parseFloat(formData.per_item_cost) || 0,
      free_threshold: formData.free_threshold ? parseFloat(formData.free_threshold) : null,
      estimated_days_min: formData.estimated_days_min ? parseInt(formData.estimated_days_min) : null,
      estimated_days_max: formData.estimated_days_max ? parseInt(formData.estimated_days_max) : null,
      position: editingOption ? editingOption.position : options.length, is_active: true
    }
    if (editingOption) {
      await supabase.from('campaign_shipping_options').update(payload as never).eq('id', editingOption.id)
      toast.success('Updated')
    } else {
      await supabase.from('campaign_shipping_options').insert(payload as never)
      toast.success('Created')
    }
    setDialogOpen(false)
    resetForm()
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_shipping_options').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shipping Options</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add Option</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingOption ? 'Edit' : 'Add'} Shipping Option</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Standard Shipping" /></div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Carrier</Label><Input value={formData.carrier} onChange={(e) => setFormData({ ...formData, carrier: e.target.value })} placeholder="USPS" /></div>
                <div className="space-y-2"><Label>Method</Label><Input value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })} placeholder="Ground" /></div>
              </div>
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-2"><Label>Base Cost ($)</Label><Input type="number" step="0.01" value={formData.base_cost} onChange={(e) => setFormData({ ...formData, base_cost: e.target.value })} placeholder="5.99" /></div>
                <div className="space-y-2"><Label>Per Item ($)</Label><Input type="number" step="0.01" value={formData.per_item_cost} onChange={(e) => setFormData({ ...formData, per_item_cost: e.target.value })} placeholder="0.00" /></div>
                <div className="space-y-2"><Label>Free Above ($)</Label><Input type="number" step="0.01" value={formData.free_threshold} onChange={(e) => setFormData({ ...formData, free_threshold: e.target.value })} placeholder="50.00" /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Est. Days (Min)</Label><Input type="number" value={formData.estimated_days_min} onChange={(e) => setFormData({ ...formData, estimated_days_min: e.target.value })} placeholder="3" /></div>
                <div className="space-y-2"><Label>Est. Days (Max)</Label><Input type="number" value={formData.estimated_days_max} onChange={(e) => setFormData({ ...formData, estimated_days_max: e.target.value })} placeholder="5" /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {options.length === 0 ? (
          <div className="py-8 text-center"><Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No shipping options configured</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Carrier</TableHead><TableHead>Base Cost</TableHead><TableHead>Free Above</TableHead><TableHead>Est. Days</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {options.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{o.carrier || '-'}</TableCell>
                  <TableCell>${o.base_cost.toFixed(2)}</TableCell>
                  <TableCell>{o.free_threshold ? `$${o.free_threshold}` : '-'}</TableCell>
                  <TableCell>{o.estimated_days_min && o.estimated_days_max ? `${o.estimated_days_min}-${o.estimated_days_max}` : '-'}</TableCell>
                  <TableCell><Badge variant={o.is_active ? 'default' : 'secondary'}>{o.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingOption(o); setFormData({ name: o.name, carrier: o.carrier || '', method: o.method || '', base_cost: o.base_cost.toString(), per_item_cost: o.per_item_cost.toString(), free_threshold: o.free_threshold?.toString() || '', estimated_days_min: o.estimated_days_min?.toString() || '', estimated_days_max: o.estimated_days_max?.toString() || '' }); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
