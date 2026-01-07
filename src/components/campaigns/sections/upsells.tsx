'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignUpsell, Product } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface UpsellsSectionProps {
  campaignId: string
}

export function UpsellsSection({ campaignId }: UpsellsSectionProps) {
  const supabase = createClient()
  const [upsells, setUpsells] = useState<CampaignUpsell[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUpsell, setEditingUpsell] = useState<CampaignUpsell | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_product_id: '',
    upsell_product_id: '',
    discount_type: '',
    discount_value: '',
  })

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    const { data: upsellsData } = await supabase
      .from('campaign_upsells')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('position')

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('name')

    setUpsells(upsellsData || [])
    setProducts(productsData || [])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_product_id: '',
      upsell_product_id: '',
      discount_type: '',
      discount_value: '',
    })
    setEditingUpsell(null)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        campaign_id: campaignId,
        name: formData.name,
        description: formData.description || null,
        trigger_product_id: formData.trigger_product_id || null,
        upsell_product_id: formData.upsell_product_id || null,
        discount_type: formData.discount_type || null,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        position: editingUpsell ? editingUpsell.position : upsells.length,
        is_active: true,
      }

      if (editingUpsell) {
        await supabase.from('campaign_upsells').update(payload as never).eq('id', editingUpsell.id)
        toast.success('Upsell updated')
      } else {
        await supabase.from('campaign_upsells').insert(payload as never)
        toast.success('Upsell created')
      }

      setDialogOpen(false)
      resetForm()
      loadData()
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_upsells').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  const getProductName = (id: string | null) => products.find(p => p.id === id)?.name || '-'

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upsells</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Add Upsell
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUpsell ? 'Edit' : 'Add'} Upsell</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Trigger Product</Label>
                  <Select value={formData.trigger_product_id} onValueChange={(v) => setFormData({ ...formData, trigger_product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Any product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Upsell Product</Label>
                  <Select value={formData.upsell_product_id} onValueChange={(v) => setFormData({ ...formData, upsell_product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type || 'none'} onValueChange={(v) => setFormData({ ...formData, discount_type: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="No discount" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {upsells.length === 0 ? (
          <div className="py-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No upsells configured</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Product Id</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Upsell</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upsells.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-sm">{u.display_id}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{getProductName(u.trigger_product_id)}</TableCell>
                  <TableCell>{getProductName(u.upsell_product_id)}</TableCell>
                  <TableCell>{u.discount_type === 'percentage' ? `${u.discount_value}%` : u.discount_type === 'fixed' ? `$${u.discount_value}` : '-'}</TableCell>
                  <TableCell><Badge variant={u.is_active ? 'default' : 'secondary'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingUpsell(u); setFormData({ name: u.name, description: u.description || '', trigger_product_id: u.trigger_product_id || '', upsell_product_id: u.upsell_product_id || '', discount_type: u.discount_type || '', discount_value: u.discount_value?.toString() || '' }); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
