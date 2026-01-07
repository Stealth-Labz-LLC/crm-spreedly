'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Campaign, CampaignCategory } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Plus,
  ChevronRight,
  Megaphone,
  Download,
  Pencil,
  Copy,
  Trash2,
  Lock,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface EnrichedCampaign extends Campaign {
  productsCount: number
  offersCount: number
  upsellsCount: number
}

interface CampaignsClientProps {
  campaigns: EnrichedCampaign[]
  filters: {
    search?: string
    status?: string
    type?: string
    category?: string
  }
}

const VIEW_OPTIONS = [
  { value: 'all', label: 'All Campaigns' },
  { value: 'active', label: 'Live Campaigns' },
  { value: 'draft', label: 'Draft Campaigns' },
  { value: 'paused', label: 'Paused Campaigns' },
  { value: 'archived', label: 'Archived Campaigns' },
]

export function CampaignsClient({
  campaigns,
  filters,
}: CampaignsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [viewFilter, setViewFilter] = useState(filters.status || 'all')
  const [categoryFilter, setCategoryFilter] = useState(filters.category || 'none')
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; campaign: EnrichedCampaign | null }>({ open: false, campaign: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [categories, setCategories] = useState<CampaignCategory[]>([])
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('campaign_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (data) {
        setCategories(data as CampaignCategory[])
      }
    }
    fetchCategories()
  }, [supabase])

  const handleViewChange = (value: string) => {
    setViewFilter(value)
    const params = new URLSearchParams()
    if (value !== 'all') params.set('status', value)
    if (categoryFilter !== 'none') params.set('category', categoryFilter)
    router.push(`/campaigns?${params.toString()}`)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    const params = new URLSearchParams()
    if (viewFilter !== 'all') params.set('status', viewFilter)
    if (value !== 'none') params.set('category', value)
    router.push(`/campaigns?${params.toString()}`)
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    setIsSavingCategory(true)
    try {
      const { data, error } = await supabase
        .from('campaign_categories')
        .insert({ name: newCategory.trim() } as never)
        .select()
        .single()

      if (error) throw error

      setCategories(prev => [...prev, data as CampaignCategory].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success(`Category "${newCategory}" created`)
      setNewCategory('')
      setShowCategoryDialog(false)
    } catch (error) {
      toast.error('Failed to create category')
      console.error(error)
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleDuplicate = async (campaign: EnrichedCampaign) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, slug, productsCount, offersCount, upsellsCount, ...campaignData } = campaign

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

  const handleDelete = async () => {
    if (!deleteDialog.campaign) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', deleteDialog.campaign.id)

      if (error) throw error

      toast.success('Campaign deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete campaign')
      console.error(error)
    } finally {
      setIsDeleting(false)
      setDeleteDialog({ open: false, campaign: null })
    }
  }

  const handleToggleLock = async (campaign: EnrichedCampaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus } as never)
        .eq('id', campaign.id)

      if (error) throw error

      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update campaign status')
      console.error(error)
    }
  }

  // Filter campaigns based on view
  const filteredCampaigns = campaigns.filter(c => {
    if (viewFilter !== 'all' && c.status !== viewFilter) return false
    if (categoryFilter !== 'none' && c.category !== categoryFilter) return false
    return true
  })

  const viewLabel = VIEW_OPTIONS.find(v => v.value === viewFilter)?.label || 'All Campaigns'
  const categoryLabel = categoryFilter !== 'none' ? categoryFilter : 'ALL'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">CAMPAIGNS</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>CRM</span>
          <ChevronRight className="h-4 w-4" />
          <span>Campaigns</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View</span>
          <Select value={viewFilter} onValueChange={handleViewChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              {VIEW_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Category</span>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowCategoryDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Category
        </Button>

        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Title with count and actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {categoryLabel} - {viewLabel.replace(' Campaigns', '')}{' '}
          <span className="text-primary">{filteredCampaigns.length} Campaigns</span>
        </h2>
        <div className="flex items-center gap-2">
          <Link href="/campaigns/new">
            <Button size="icon" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Campaigns Table */}
      {filteredCampaigns.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No campaigns found</p>
          <Link href="/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px]">Id</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-center">Offers</TableHead>
                <TableHead className="text-center">Upsells</TableHead>
                <TableHead className="text-center">Q A</TableHead>
                <TableHead className="text-center">Order Entry</TableHead>
                <TableHead className="text-center">C B P Enabled</TableHead>
                <TableHead className="text-center">Cap On Shipment</TableHead>
                <TableHead className="w-[160px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign, index) => (
                <TableRow key={campaign.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">
                    {campaign.display_id ?? index + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/campaigns/${campaign.id}/edit`}
                      className="font-medium hover:underline text-foreground"
                    >
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">
                    {campaign.campaign_type === 'web' ? 'Lander' : campaign.campaign_type}
                  </TableCell>
                  <TableCell className="font-mono">
                    {campaign.currency}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.offersCount}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.upsellsCount}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.quality_assurance && (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.list_in_order_entry && (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.chargeback_blacklist && (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.capture_on_shipment && (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/campaigns/${campaign.id}/edit`}>
                        <Button size="icon" variant="default" className="h-8 w-8 bg-blue-500 hover:bg-blue-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleDuplicate(campaign)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteDialog({ open: true, campaign })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleToggleLock(campaign)}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your campaigns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} disabled={isSavingCategory}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isSavingCategory}>
              {isSavingCategory ? 'Creating...' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, campaign: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.campaign?.name}&quot;? This action
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
    </div>
  )
}
