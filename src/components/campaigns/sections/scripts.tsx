'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignScript } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Save } from 'lucide-react'
import { toast } from 'sonner'

interface ScriptsSectionProps {
  campaignId: string
}

const SCRIPT_TYPES = [
  { id: 'header', name: 'Header Scripts', description: 'Scripts loaded in the <head> section' },
  { id: 'footer', name: 'Footer Scripts', description: 'Scripts loaded before </body>' },
  { id: 'checkout', name: 'Checkout Scripts', description: 'Scripts for checkout page' },
  { id: 'thank_you', name: 'Thank You Scripts', description: 'Scripts for order confirmation' },
  { id: 'tracking', name: 'Tracking Scripts', description: 'Conversion tracking pixels' },
]

export function ScriptsSection({ campaignId }: ScriptsSectionProps) {
  const supabase = createClient()
  const [scripts, setScripts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { loadData() }, [campaignId])

  const loadData = async () => {
    const { data } = await supabase.from('campaign_scripts').select('*').eq('campaign_id', campaignId)
    const scriptMap: Record<string, string> = {}
    type ScriptRow = { script_type: string; script_content: string | null }
    ;(data as ScriptRow[] | null)?.forEach(s => { scriptMap[s.script_type] = s.script_content || '' })
    setScripts(scriptMap)
    setIsLoading(false)
  }

  const handleSave = async (scriptType: string) => {
    setIsSaving(true)
    const content = scripts[scriptType] || ''
    const { data: existingData } = await supabase.from('campaign_scripts').select('id').eq('campaign_id', campaignId).eq('script_type', scriptType).single()
    const existing = existingData as { id: string } | null

    if (existing) {
      await supabase.from('campaign_scripts').update({ script_content: content } as never).eq('id', existing.id)
    } else {
      await supabase.from('campaign_scripts').insert({ campaign_id: campaignId, name: scriptType, script_type: scriptType, script_content: content, is_active: true } as never)
    }
    toast.success('Script saved')
    setIsSaving(false)
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Campaign Scripts</CardTitle>
        <CardDescription>Add custom JavaScript or tracking pixels to your campaign pages</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="header">
          <TabsList className="grid grid-cols-5 w-full">
            {SCRIPT_TYPES.map(t => <TabsTrigger key={t.id} value={t.id}>{t.name.split(' ')[0]}</TabsTrigger>)}
          </TabsList>
          {SCRIPT_TYPES.map(t => (
            <TabsContent key={t.id} value={t.id} className="space-y-4">
              <div>
                <Label>{t.name}</Label>
                <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                <Textarea
                  className="font-mono text-sm min-h-[200px]"
                  placeholder={`<!-- ${t.name} -->\n<script>\n  // Your code here\n</script>`}
                  value={scripts[t.id] || ''}
                  onChange={(e) => setScripts({ ...scripts, [t.id]: e.target.value })}
                />
              </div>
              <Button onClick={() => handleSave(t.id)} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> Save {t.name.split(' ')[0]} Script
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
