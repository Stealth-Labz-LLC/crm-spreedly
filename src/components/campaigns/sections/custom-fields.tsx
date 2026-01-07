'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignCustomField } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, FormInput, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface CustomFieldsSectionProps {
  campaignId: string
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Text Area' },
]

export function CustomFieldsSection({ campaignId }: CustomFieldsSectionProps) {
  const supabase = createClient()
  const [fields, setFields] = useState<CampaignCustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    field_name: '', field_label: '', field_type: 'text', placeholder: '', is_required: false, options: ''
  })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_custom_fields').select('*').eq('campaign_id', campaignId).order('position')
    setFields(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.field_name || !formData.field_label) { toast.error('Name and label required'); return }
    const options = formData.field_type === 'select' && formData.options
      ? formData.options.split(',').map(o => o.trim()).filter(Boolean)
      : []
    await supabase.from('campaign_custom_fields').insert({
      campaign_id: campaignId,
      field_name: formData.field_name.toLowerCase().replace(/\s+/g, '_'),
      field_label: formData.field_label,
      field_type: formData.field_type,
      placeholder: formData.placeholder || null,
      is_required: formData.is_required,
      options: options,
      position: fields.length,
      is_active: true
    } as never)
    toast.success('Custom field added')
    setDialogOpen(false)
    setFormData({ field_name: '', field_label: '', field_type: 'text', placeholder: '', is_required: false, options: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_custom_fields').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Fields</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Field</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Custom Field</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Field Name *</Label><Input value={formData.field_name} onChange={(e) => setFormData({ ...formData, field_name: e.target.value })} placeholder="date_of_birth" /></div>
                <div className="space-y-2"><Label>Field Label *</Label><Input value={formData.field_label} onChange={(e) => setFormData({ ...formData, field_label: e.target.value })} placeholder="Date of Birth" /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Field Type</Label>
                  <Select value={formData.field_type} onValueChange={(v) => setFormData({ ...formData, field_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Placeholder</Label><Input value={formData.placeholder} onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })} /></div>
              </div>
              {formData.field_type === 'select' && (
                <div className="space-y-2"><Label>Options (comma-separated)</Label><Input value={formData.options} onChange={(e) => setFormData({ ...formData, options: e.target.value })} placeholder="Option 1, Option 2, Option 3" /></div>
              )}
              <div className="flex items-center gap-2"><Switch checked={formData.is_required} onCheckedChange={(v) => setFormData({ ...formData, is_required: v })} /><Label>Required Field</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Add Field</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="py-8 text-center"><FormInput className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No custom fields configured</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Name</TableHead><TableHead>Label</TableHead><TableHead>Type</TableHead><TableHead>Required</TableHead><TableHead>Status</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.id}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                  <TableCell className="font-mono text-sm">{f.field_name}</TableCell>
                  <TableCell>{f.field_label}</TableCell>
                  <TableCell><Badge variant="outline">{f.field_type}</Badge></TableCell>
                  <TableCell>{f.is_required && <Badge variant="secondary">Required</Badge>}</TableCell>
                  <TableCell><Badge variant={f.is_active ? 'default' : 'secondary'}>{f.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
