'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignTermsOfService } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Eye, FileText, Save } from 'lucide-react'
import { toast } from 'sonner'

interface TermsOfServiceSectionProps {
  campaignId: string
}

export function TermsOfServiceSection({ campaignId }: TermsOfServiceSectionProps) {
  const supabase = createClient()
  const [terms, setTerms] = useState<CampaignTermsOfService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [formData, setFormData] = useState({ version: '', title: 'Terms of Service', content: '' })

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_terms_of_service').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false })
    setTerms(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.version || !formData.content) { toast.error('Version and content required'); return }
    // Deactivate previous versions
    await supabase.from('campaign_terms_of_service').update({ is_active: false } as never).eq('campaign_id', campaignId)
    // Create new version
    await supabase.from('campaign_terms_of_service').insert({
      campaign_id: campaignId, version: formData.version, title: formData.title,
      content: formData.content, is_active: true
    } as never)
    toast.success('Terms of Service created')
    setDialogOpen(false)
    setFormData({ version: '', title: 'Terms of Service', content: '' })
    loadData()
  }

  const handleSetActive = async (id: string) => {
    await supabase.from('campaign_terms_of_service').update({ is_active: false } as never).eq('campaign_id', campaignId)
    await supabase.from('campaign_terms_of_service').update({ is_active: true } as never).eq('id', id)
    toast.success('Updated')
    loadData()
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Terms of Service</CardTitle>
            <CardDescription>Manage terms that customers must agree to</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Version</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Terms of Service Version</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2"><Label>Version *</Label><Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} placeholder="1.0" /></div>
                  <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Terms Content *</Label>
                  <Textarea
                    className="min-h-[300px]"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter your terms of service content here. You can use markdown formatting..."
                  />
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Create Version</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <div className="py-8 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No terms of service configured</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Title</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {terms.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono">{t.version}</TableCell>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => !t.is_active && handleSetActive(t.id)}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setPreviewContent(t.content); setPreviewOpen(true) }}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Terms of Service Preview</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{previewContent}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
