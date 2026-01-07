'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignSurcharge } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface SurchargeSectionProps {
  campaignId: string
}

export function SurchargeSection({ campaignId }: SurchargeSectionProps) {
  const supabase = createClient()
  const [surcharges, setSurcharges] = useState<CampaignSurcharge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', surcharge_type: 'handling', amount: '', percentage: '', apply_to: 'order' })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_surcharges').select('*').eq('campaign_id', campaignId).order('position')
    setSurcharges(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name required'); return }
    await supabase.from('campaign_surcharges').insert({
      campaign_id: campaignId, name: formData.name, surcharge_type: formData.surcharge_type,
      amount: formData.amount ? parseFloat(formData.amount) : null,
      percentage: formData.percentage ? parseFloat(formData.percentage) : null,
      apply_to: formData.apply_to, position: surcharges.length, is_active: true
    } as never)
    toast.success('Surcharge added')
    setDialogOpen(false)
    setFormData({ name: '', surcharge_type: 'handling', amount: '', percentage: '', apply_to: 'order' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_surcharges').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Surcharges</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Surcharge</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Surcharge</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Handling Fee" /></div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={formData.surcharge_type} onValueChange={(v) => setFormData({ ...formData, surcharge_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handling">Handling</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="rush">Rush</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Apply To</Label>
                  <Select value={formData.apply_to} onValueChange={(v) => setFormData({ ...formData, apply_to: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Fixed Amount ($)</Label><Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="2.99" /></div>
                <div className="space-y-2"><Label>Percentage (%)</Label><Input type="number" step="0.01" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} placeholder="3.5" /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {surcharges.length === 0 ? (
          <div className="py-8 text-center"><DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No surcharges configured</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Apply To</TableHead><TableHead>Status</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {surcharges.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.surcharge_type}</Badge></TableCell>
                  <TableCell>{s.amount ? `$${s.amount}` : ''}{s.percentage ? `${s.percentage}%` : ''}{!s.amount && !s.percentage ? '-' : ''}</TableCell>
                  <TableCell>{s.apply_to}</TableCell>
                  <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
