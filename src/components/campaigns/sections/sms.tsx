'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignSms } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Save } from 'lucide-react'
import { toast } from 'sonner'

interface SmsSectionProps {
  campaignId: string
}

const SMS_TYPES = [
  { id: 'confirmation', name: 'Order Confirmation' },
  { id: 'shipped', name: 'Order Shipped' },
  { id: 'delivered', name: 'Delivered' },
  { id: 'abandoned', name: 'Abandoned Cart' },
]

export function SmsSection({ campaignId }: SmsSectionProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_sms').select('*').eq('campaign_id', campaignId)
    const smsMap: Record<string, string> = {}
    type SmsRow = { sms_type: string; message_template: string }
    ;(data as SmsRow[] | null)?.forEach(s => { smsMap[s.sms_type] = s.message_template })
    setMessages(smsMap)
    setIsLoading(false)
  }

  const handleSave = async (smsType: string) => {
    const message = messages[smsType]
    if (!message) { toast.error('Message required'); return }
    setIsSaving(true)
    const { data: existingData } = await supabase.from('campaign_sms').select('id').eq('campaign_id', campaignId).eq('sms_type', smsType).single()
    const existing = existingData as { id: string } | null

    if (existing) {
      await supabase.from('campaign_sms').update({ message_template: message } as never).eq('id', existing.id)
    } else {
      await supabase.from('campaign_sms').insert({ campaign_id: campaignId, sms_type: smsType, message_template: message, is_active: true } as never)
    }
    toast.success('SMS template saved')
    setIsSaving(false)
  }

  const getCharCount = (text: string) => text?.length || 0
  const getSegments = (text: string) => Math.ceil((text?.length || 0) / 160) || 1

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> SMS Templates</CardTitle>
        <CardDescription>Configure SMS notifications for this campaign (160 chars per segment)</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="confirmation">
          <TabsList className="grid grid-cols-4 w-full">
            {SMS_TYPES.map(t => <TabsTrigger key={t.id} value={t.id}>{t.name.split(' ')[0]}</TabsTrigger>)}
          </TabsList>
          {SMS_TYPES.map(t => (
            <TabsContent key={t.id} value={t.id} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t.name} Message</Label>
                  <span className="text-sm text-muted-foreground">
                    {getCharCount(messages[t.id])} chars ({getSegments(messages[t.id])} segment{getSegments(messages[t.id]) > 1 ? 's' : ''})
                  </span>
                </div>
                <Textarea
                  className="min-h-[120px]"
                  value={messages[t.id] || ''}
                  onChange={(e) => setMessages({ ...messages, [t.id]: e.target.value })}
                  placeholder={`Hi {{customer_name}}, your order #{{order_number}} has been ${t.id === 'confirmation' ? 'received' : t.id}!`}
                  maxLength={480}
                />
                <div className="text-sm text-muted-foreground">
                  Variables: {'{{customer_name}}'}, {'{{order_number}}'}, {'{{tracking_number}}'}
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
