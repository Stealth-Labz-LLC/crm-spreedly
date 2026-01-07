'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  BarChart3,
  Archive,
  Play,
  Pause,
} from 'lucide-react'
import { toast } from 'sonner'

interface CampaignActionsProps {
  campaign: Campaign
}

export function CampaignActions({ campaign }: CampaignActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id)

      if (error) throw error

      toast.success('Campaign deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete campaign')
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, slug, ...campaignData } = campaign

      const { error } = await supabase.from('campaigns').insert({
        ...campaignData,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
      } as never)

      if (error) throw error

      toast.success('Campaign duplicated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to duplicate campaign')
      console.error(error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus } as never)
        .eq('id', campaign.id)

      if (error) throw error

      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'archived'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update campaign status')
      console.error(error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/campaigns/${campaign.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/campaigns/${campaign.id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {campaign.status !== 'active' && (
            <DropdownMenuItem onClick={() => handleStatusChange('active')}>
              <Play className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
          {campaign.status === 'active' && (
            <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </DropdownMenuItem>
          )}
          {campaign.status !== 'archived' && (
            <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{campaign.name}&quot;? This action
              cannot be undone and will remove all associated data including
              products, offers, shipping options, and analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
