'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignBlockedBin } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Ban } from 'lucide-react'
import { toast } from 'sonner'

interface BlockedBinsSectionProps {
  campaignId: string
}

export function BlockedBinsSection({ campaignId }: BlockedBinsSectionProps) {
  const supabase = createClient()
  const [bins, setBins] = useState<CampaignBlockedBin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ bin_prefix: '', reason: '' })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_blocked_bins').select('*').eq('campaign_id', campaignId).order('bin_prefix')
    setBins(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.bin_prefix || formData.bin_prefix.length < 4) { toast.error('BIN prefix must be at least 4 digits'); return }
    // Check if already exists
    if (bins.some(b => b.bin_prefix === formData.bin_prefix)) { toast.error('BIN prefix already blocked'); return }
    await supabase.from('campaign_blocked_bins').insert({
      campaign_id: campaignId, bin_prefix: formData.bin_prefix, reason: formData.reason || null, is_active: true
    } as never)
    toast.success('BIN prefix blocked')
    setDialogOpen(false)
    setFormData({ bin_prefix: '', reason: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('campaign_blocked_bins').delete().eq('id', id)
    toast.success('Removed')
    loadData()
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from('campaign_blocked_bins').update({ is_active: !currentActive } as never).eq('id', id)
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Blocked BINs</CardTitle>
          <CardDescription>Block specific card BIN prefixes (first 4-8 digits)</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Block BIN</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Block BIN Prefix</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>BIN Prefix *</Label>
                <Input
                  value={formData.bin_prefix}
                  onChange={(e) => setFormData({ ...formData, bin_prefix: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  placeholder="411111"
                  maxLength={8}
                />
                <p className="text-sm text-muted-foreground">First 4-8 digits of the card number</p>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="High chargeback rate"
                />
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Block</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {bins.length === 0 ? (
          <div className="py-8 text-center"><Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No BINs blocked</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>BIN Prefix</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {bins.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono font-medium">{b.bin_prefix}</TableCell>
                  <TableCell>{b.reason || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={b.is_active ? 'destructive' : 'secondary'} className="cursor-pointer" onClick={() => handleToggleActive(b.id, b.is_active)}>
                      {b.is_active ? 'Blocked' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
