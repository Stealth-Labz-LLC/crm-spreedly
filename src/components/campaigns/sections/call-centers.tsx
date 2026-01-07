'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignCallCenter } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface CallCentersSectionProps {
  campaignId: string
}

export function CallCentersSection({ campaignId }: CallCentersSectionProps) {
  const supabase = createClient()
  const [centers, setCenters] = useState<CampaignCallCenter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone_number: '', hours_of_operation: '', timezone: 'America/New_York', is_default: false })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_call_centers').select('*').eq('campaign_id', campaignId).order('name')
    setCenters(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.phone_number) { toast.error('Name and phone required'); return }
    await supabase.from('campaign_call_centers').insert({
      campaign_id: campaignId, name: formData.name, phone_number: formData.phone_number,
      hours_of_operation: formData.hours_of_operation || null, timezone: formData.timezone,
      is_default: formData.is_default, is_active: true
    } as never)
    toast.success('Call center added')
    setDialogOpen(false)
    setFormData({ name: '', phone_number: '', hours_of_operation: '', timezone: 'America/New_York', is_default: false })
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_call_centers').delete().eq('id', id)
    toast.success('Deleted')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Call Centers</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Call Center</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Call Center</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Main Support" /></div>
              <div className="space-y-2"><Label>Phone Number *</Label><Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="1-800-555-0123" /></div>
              <div className="space-y-2"><Label>Hours of Operation</Label><Input value={formData.hours_of_operation} onChange={(e) => setFormData({ ...formData, hours_of_operation: e.target.value })} placeholder="Mon-Fri 9am-5pm EST" /></div>
              <div className="space-y-2"><Label>Timezone</Label><Input value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={formData.is_default} onCheckedChange={(v) => setFormData({ ...formData, is_default: v })} /><Label>Default Call Center</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {centers.length === 0 ? (
          <div className="py-8 text-center"><Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No call centers configured</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Hours</TableHead><TableHead>Default</TableHead><TableHead>Status</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {centers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone_number}</TableCell>
                  <TableCell>{c.hours_of_operation || '-'}</TableCell>
                  <TableCell>{c.is_default && <Badge>Default</Badge>}</TableCell>
                  <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
