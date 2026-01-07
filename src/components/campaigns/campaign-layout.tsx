'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  Save,
  Settings,
  Globe,
  Tag,
  TrendingUp,
  Percent,
  Ticket,
  Truck,
  DollarSign,
  Code,
  Phone,
  Mail,
  MessageSquare,
  FormInput,
  FileText,
  Ban,
} from 'lucide-react'
import { toast } from 'sonner'

// Section definitions
export const CAMPAIGN_SECTIONS = [
  { id: 'general', label: 'General Details', icon: Settings },
  { id: 'countries', label: 'Countries', icon: Globe },
  { id: 'offers', label: 'Offers', icon: Tag },
  { id: 'upsells', label: 'Upsells', icon: TrendingUp },
  { id: 'sales-tax', label: 'Sales Tax', icon: Percent },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'surcharge', label: 'Surcharge', icon: DollarSign },
  { id: 'scripts', label: 'Scripts', icon: Code },
  { id: 'call-centers', label: 'Call Centers', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'custom-fields', label: 'Custom Fields', icon: FormInput },
  { id: 'terms-of-service', label: 'Terms of Service', icon: FileText },
  { id: 'blocked-bins', label: 'Blocked Bins', icon: Ban },
] as const

export type CampaignSectionId = typeof CAMPAIGN_SECTIONS[number]['id']

interface CampaignLayoutProps {
  campaign: Campaign | null
  activeSection: CampaignSectionId
  onSectionChange: (section: CampaignSectionId) => void
  onSave?: () => Promise<void>
  isSaving?: boolean
  isDirty?: boolean
  children: React.ReactNode
}

export function CampaignLayout({
  campaign,
  activeSection,
  onSectionChange,
  onSave,
  isSaving = false,
  isDirty = false,
  children,
}: CampaignLayoutProps) {
  const router = useRouter()
  const supabase = createClient()
  const isNewCampaign = !campaign

  const handleSave = async () => {
    if (onSave) {
      await onSave()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'draft':
        return 'bg-gray-400'
      case 'paused':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-blue-500'
      case 'archived':
        return 'bg-gray-600'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/campaigns" className="hover:text-foreground">
                  CRM
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/campaigns" className="hover:text-foreground">
                  Campaigns
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>{isNewCampaign ? 'New Campaign' : 'Edit Campaign'}</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {isNewCampaign ? 'New Campaign' : campaign.name}
                </h1>
                {campaign && (
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', getStatusColor(campaign.status))} />
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                )}
              </div>
              {campaign && (
                <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>
                  Last Update: {new Date(campaign.updated_at).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isDirty && (
                <Badge variant="outline" className="text-yellow-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 shrink-0">
            <nav className="space-y-1">
              {CAMPAIGN_SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
