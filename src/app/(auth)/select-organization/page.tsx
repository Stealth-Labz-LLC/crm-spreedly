'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  logo_url: string | null
}

interface Membership {
  role: 'owner' | 'admin' | 'member'
  organization: Organization
}

export default function SelectOrganizationPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get all organizations the user is a member of
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization:organizations (
            id,
            name,
            slug,
            plan,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (fetchError) {
        console.error('Error fetching organizations:', fetchError)
        setError('Failed to load organizations')
        return
      }

      if (!data || data.length === 0) {
        setError('You are not a member of any organization. Please contact your administrator.')
        return
      }

      setMemberships(data as Membership[])

      // If user has only one organization, select it automatically
      if (data.length === 1) {
        const membership = data[0] as Membership
        await selectOrganization(membership.organization.id)
      }
    } catch (err) {
      console.error('Error loading organizations:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const selectOrganization = async (organizationId: string) => {
    setSwitching(organizationId)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Update user's current organization
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          current_organization_id: organizationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating organization:', updateError)
        setError('Failed to switch organization')
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Error selecting organization:', err)
      setError('An unexpected error occurred')
    } finally {
      setSwitching(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'professional':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">Loading organizations...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Select Organization</CardTitle>
          <CardDescription className="text-center">
            Choose which organization you want to work with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          {memberships.length === 0 && !error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You don't have access to any organizations yet.
              </p>
              <Button onClick={() => router.push('/register')}>
                Create New Organization
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {memberships.map((membership) => (
              <Card
                key={membership.organization.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => selectOrganization(membership.organization.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {membership.organization.logo_url ? (
                        <img
                          src={membership.organization.logo_url}
                          alt={membership.organization.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">
                            {membership.organization.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">
                          {membership.organization.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {membership.organization.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getPlanBadgeColor(membership.organization.plan)}>
                        {membership.organization.plan}
                      </Badge>
                      <Badge className={getRoleBadgeColor(membership.role)}>
                        {membership.role}
                      </Badge>
                      <Button
                        size="sm"
                        disabled={switching === membership.organization.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          selectOrganization(membership.organization.id)
                        }}
                      >
                        {switching === membership.organization.id ? 'Switching...' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                supabase.auth.signOut()
                router.push('/login')
              }}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
