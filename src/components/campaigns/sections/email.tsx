'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignEmail } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Save } from 'lucide-react'
import { toast } from 'sonner'

interface EmailSectionProps {
  campaignId: string
}

const EMAIL_TYPES = [
  { id: 'confirmation', name: 'Order Confirmation' },
  { id: 'shipped', name: 'Order Shipped' },
  { id: 'delivered', name: 'Order Delivered' },
  { id: 'abandoned', name: 'Abandoned Cart' },
  { id: 'subscription_reminder', name: 'Subscription Reminder' },
]

export function EmailSection({ campaignId }: EmailSectionProps) {
  const supabase = createClient()
  const [emails, setEmails] = useState<Record<string, { subject: string; body_html: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_emails').select('*').eq('campaign_id', campaignId)
    const emailMap: Record<string, { subject: string; body_html: string }> = {}
    type EmailRow = { email_type: string; subject: string; body_html: string | null }
    ;(data as EmailRow[] | null)?.forEach(e => { emailMap[e.email_type] = { subject: e.subject, body_html: e.body_html || '' } })
    setEmails(emailMap)
    setIsLoading(false)
  }

  const handleSave = async (emailType: string) => {
    const email = emails[emailType]
    if (!email?.subject) { toast.error('Subject required'); return }
    setIsSaving(true)
    const { data: existingData } = await supabase.from('campaign_emails').select('id').eq('campaign_id', campaignId).eq('email_type', emailType).single()
    const existing = existingData as { id: string } | null

    if (existing) {
      await supabase.from('campaign_emails').update({ subject: email.subject, body_html: email.body_html } as never).eq('id', existing.id)
    } else {
      await supabase.from('campaign_emails').insert({ campaign_id: campaignId, email_type: emailType, subject: email.subject, body_html: email.body_html, is_active: true } as never)
    }
    toast.success('Email template saved')
    setIsSaving(false)
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email Templates</CardTitle>
        <CardDescription>Configure automated email notifications for this campaign</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="confirmation">
          <TabsList className="grid grid-cols-5 w-full">
            {EMAIL_TYPES.map(t => <TabsTrigger key={t.id} value={t.id}>{t.name.split(' ')[0]}</TabsTrigger>)}
          </TabsList>
          {EMAIL_TYPES.map(t => (
            <TabsContent key={t.id} value={t.id} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={emails[t.id]?.subject || ''}
                    onChange={(e) => setEmails({ ...emails, [t.id]: { ...emails[t.id], subject: e.target.value, body_html: emails[t.id]?.body_html || '' } })}
                    placeholder={`Your ${t.name.toLowerCase()} from {{company_name}}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Body (HTML)</Label>
                  <Textarea
                    className="font-mono text-sm min-h-[300px]"
                    value={emails[t.id]?.body_html || ''}
                    onChange={(e) => setEmails({ ...emails, [t.id]: { ...emails[t.id], subject: emails[t.id]?.subject || '', body_html: e.target.value } })}
                    placeholder="<html>...</html>"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Variables: {'{{customer_name}}'}, {'{{order_number}}'}, {'{{order_total}}'}, {'{{company_name}}'}
                </div>
              </div>
              <Button onClick={() => handleSave(t.id)} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> Save Template
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
