'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignSalesTax } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Percent, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface SalesTaxSectionProps {
  campaignId: string
}

export function SalesTaxSection({ campaignId }: SalesTaxSectionProps) {
  const supabase = createClient()
  const [taxes, setTaxes] = useState<CampaignSalesTax[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<CampaignSalesTax | null>(null)
  const [formData, setFormData] = useState({ country_code: '', state_code: '', tax_rate: '', tax_name: '', is_inclusive: false })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_sales_tax').select('*').eq('campaign_id', campaignId).order('country_code')
    setTaxes(data || [])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({ country_code: '', state_code: '', tax_rate: '', tax_name: '', is_inclusive: false })
    setEditingTax(null)
  }

  const handleSave = async () => {
    if (!formData.country_code || !formData.tax_rate) { toast.error('Country and rate required'); return }

    const payload = {
      campaign_id: campaignId,
      country_code: formData.country_code,
      state_code: formData.state_code || null,
      tax_rate: parseFloat(formData.tax_rate) / 100,
      tax_name: formData.tax_name || null,
      is_inclusive: formData.is_inclusive,
      is_active: true
    }

    if (editingTax) {
      await supabase.from('campaign_sales_tax').update(payload as never).eq('id', editingTax.id)
      toast.success('Tax rule updated')
    } else {
      await supabase.from('campaign_sales_tax').insert(payload as never)
      toast.success('Tax rule added')
    }

    setDialogOpen(false)
    resetForm()
    loadData()
  }

  const handleEdit = (tax: CampaignSalesTax) => {
    setEditingTax(tax)
    setFormData({
      country_code: tax.country_code,
      state_code: tax.state_code || '',
      tax_rate: (tax.tax_rate * 100).toString(),
      tax_name: tax.tax_name || '',
      is_inclusive: tax.is_inclusive
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_sales_tax').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sales Tax</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add Tax Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTax ? 'Edit Tax Rule' : 'Add Tax Rule'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Country Code *</Label><Input value={formData.country_code} onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })} placeholder="US" maxLength={2} /></div>
                <div className="space-y-2"><Label>State Code</Label><Input value={formData.state_code} onChange={(e) => setFormData({ ...formData, state_code: e.target.value.toUpperCase() })} placeholder="CA" maxLength={10} /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Tax Rate (%) *</Label><Input type="number" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })} placeholder="8.25" /></div>
                <div className="space-y-2"><Label>Tax Name</Label><Input value={formData.tax_name} onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })} placeholder="Sales Tax" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={formData.is_inclusive} onCheckedChange={(v) => setFormData({ ...formData, is_inclusive: v })} /><Label>Tax Inclusive</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editingTax ? 'Save' : 'Add'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {taxes.length === 0 ? (
          <div className="py-8 text-center"><Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No tax rules configured</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>State</TableHead><TableHead>Rate</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {taxes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono">{t.country_code}</TableCell>
                  <TableCell className="font-mono">{t.state_code || '-'}</TableCell>
                  <TableCell>{(t.tax_rate * 100).toFixed(2)}%</TableCell>
                  <TableCell>{t.tax_name || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{t.is_inclusive ? 'Inclusive' : 'Exclusive'}</Badge></TableCell>
                  <TableCell><Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
