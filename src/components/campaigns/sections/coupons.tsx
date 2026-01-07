'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignCoupon } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react'
import { toast } from 'sonner'

interface CouponsSectionProps {
  campaignId: string
}

export function CouponsSection({ campaignId }: CouponsSectionProps) {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<CampaignCoupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<CampaignCoupon | null>(null)
  const [formData, setFormData] = useState({
    code: '', name: '', discount_type: 'fixed', discount_value: '', min_order_value: '', max_uses: '', uses_per_customer: '1'
  })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_coupons').select('*').eq('campaign_id', campaignId).order('code')
    setCoupons(data || [])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({ code: '', name: '', discount_type: 'fixed', discount_value: '', min_order_value: '', max_uses: '', uses_per_customer: '1' })
    setEditingCoupon(null)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.discount_value) { toast.error('Code and discount required'); return }
    const payload = {
      campaign_id: campaignId, code: formData.code.toUpperCase(), name: formData.name || null,
      discount_type: formData.discount_type, discount_value: parseFloat(formData.discount_value),
      min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      uses_per_customer: parseInt(formData.uses_per_customer) || 1, is_active: true
    }
    if (editingCoupon) {
      await supabase.from('campaign_coupons').update(payload as never).eq('id', editingCoupon.id)
      toast.success('Coupon updated')
    } else {
      await supabase.from('campaign_coupons').insert(payload as never)
      toast.success('Coupon created')
    }
    setDialogOpen(false)
    resetForm()
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_coupons').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Coupons</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCoupon ? 'Edit' : 'Add'} Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Coupon Code *</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="SAVE20" /></div>
                <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Summer Sale" /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Discount Value *</Label><Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'} /></div>
              </div>
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-2"><Label>Min Order</Label><Input type="number" value={formData.min_order_value} onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })} placeholder="50.00" /></div>
                <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} placeholder="100" /></div>
                <div className="space-y-2"><Label>Per Customer</Label><Input type="number" value={formData.uses_per_customer} onChange={(e) => setFormData({ ...formData, uses_per_customer: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {coupons.length === 0 ? (
          <div className="py-8 text-center"><Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No coupons configured</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Discount</TableHead><TableHead>Min Order</TableHead><TableHead>Uses</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.name || '-'}</TableCell>
                  <TableCell>{c.discount_type === 'percentage' ? `${c.discount_value}%` : c.discount_type === 'free_shipping' ? 'Free Shipping' : `$${c.discount_value}`}</TableCell>
                  <TableCell>{c.min_order_value ? `$${c.min_order_value}` : '-'}</TableCell>
                  <TableCell>{c.current_uses}/{c.max_uses || '∞'}</TableCell>
                  <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCoupon(c); setFormData({ code: c.code, name: c.name || '', discount_type: c.discount_type, discount_value: c.discount_value.toString(), min_order_value: c.min_order_value?.toString() || '', max_uses: c.max_uses?.toString() || '', uses_per_customer: c.uses_per_customer.toString() }); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
