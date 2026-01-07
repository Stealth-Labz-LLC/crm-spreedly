/**
 * Organization Context Helper
 *
 * This module provides utilities for managing organization context throughout the application.
 * Every dashboard page should call getOrganizationContext() to ensure the user has proper
 * organization access.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

// =====================================================
// Types
// =====================================================

export type OrganizationRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  display_id: number
  name: string
  slug: string
  plan: 'starter' | 'professional' | 'enterprise' | 'custom'
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at: string | null
  max_users: number
  max_api_calls_per_month: number
  logo_url: string | null
  primary_color: string | null
  timezone: string
  currency: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  status: 'invited' | 'active' | 'suspended'
  permissions: Record<string, any>
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  current_organization_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface OrganizationContext {
  user: User
  profile: UserProfile
  organization: Organization
  membership: OrganizationMember
  role: OrganizationRole
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
}

// =====================================================
// Main Context Function
// =====================================================

/**
 * Get the current organization context for the authenticated user
 *
 * This function:
 * 1. Verifies user is authenticated
 * 2. Loads user profile with current organization
 * 3. Verifies active membership in the organization
 * 4. Returns complete organization context
 *
 * @throws Redirects to /login if not authenticated
 * @throws Redirects to /select-organization if no organization selected
 * @throws Redirects to /select-organization if membership is invalid
 * @returns OrganizationContext with user, organization, and role information
 */
export async function getOrganizationContext(): Promise<OrganizationContext> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile with current organization
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Profile doesn't exist - redirect to create organization
    redirect('/onboarding')
  }

  if (!profile.current_organization_id) {
    // No organization selected - show organization selector
    redirect('/select-organization')
  }

  // Get organization details
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.current_organization_id)
    .single()

  if (orgError || !organization) {
    // Organization doesn't exist - clear current org and redirect
    await supabase
      .from('user_profiles')
      .update({ current_organization_id: null })
      .eq('id', user.id)

    redirect('/select-organization')
  }

  // Verify active membership in the organization
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('organization_id', organization.id)
    .eq('status', 'active')
    .single()

  if (memberError || !membership) {
    // Not a member or membership is not active - clear and redirect
    await supabase
      .from('user_profiles')
      .update({ current_organization_id: null })
      .eq('id', user.id)

    redirect('/select-organization')
  }

  // Build context object
  const role = membership.role as OrganizationRole

  return {
    user,
    profile,
    organization,
    membership,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isMember: true, // If we got here, user is definitely a member
  }
}

// =====================================================
// Optional Context (No Redirect)
// =====================================================

/**
 * Get organization context without redirecting
 * Returns null if user is not authenticated or has no organization
 *
 * Useful for components that need to handle missing context gracefully
 */
export async function getOrganizationContextOptional(): Promise<OrganizationContext | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.current_organization_id) return null

    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.current_organization_id)
      .single()

    if (!organization) return null

    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization.id)
      .eq('status', 'active')
      .single()

    if (!membership) return null

    const role = membership.role as OrganizationRole

    return {
      user,
      profile,
      organization,
      membership,
      role,
      isOwner: role === 'owner',
      isAdmin: role === 'owner' || role === 'admin',
      isMember: true,
    }
  } catch (error) {
    return null
  }
}

// =====================================================
// User Organizations
// =====================================================

/**
 * Get all organizations the current user belongs to
 *
 * @returns Array of organizations with membership info
 */
export async function getUserOrganizations() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (error || !memberships) return []

  return memberships.map(m => ({
    organization: m.organization as Organization,
    membership: {
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role: m.role as OrganizationRole,
      status: m.status,
      permissions: m.permissions,
      invited_by: m.invited_by,
      invited_at: m.invited_at,
      joined_at: m.joined_at,
      created_at: m.created_at,
      updated_at: m.updated_at,
    } as OrganizationMember
  }))
}

// =====================================================
// Permission Checks
// =====================================================

/**
 * Check if user has admin access (owner or admin role)
 */
export function hasAdminAccess(context: OrganizationContext): boolean {
  return context.isAdmin
}

/**
 * Check if user has owner access
 */
export function hasOwnerAccess(context: OrganizationContext): boolean {
  return context.isOwner
}

/**
 * Require admin access or redirect
 */
export function requireAdmin(context: OrganizationContext) {
  if (!context.isAdmin) {
    redirect('/dashboard')
  }
}

/**
 * Require owner access or redirect
 */
export function requireOwner(context: OrganizationContext) {
  if (!context.isOwner) {
    redirect('/dashboard')
  }
}

// =====================================================
// Switch Organization
// =====================================================

/**
 * Switch the user's current organization
 *
 * @param organizationId - The organization ID to switch to
 * @returns Success boolean
 */
export async function switchOrganization(organizationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Verify user is a member of the organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single()

  if (!membership) return false

  // Update current organization
  const { error } = await supabase
    .from('user_profiles')
    .update({
      current_organization_id: organizationId,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  return !error
}

// =====================================================
// Get Organization by ID
// =====================================================

/**
 * Get organization details by ID (with permission check)
 * Returns null if user is not a member
 */
export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verify membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single()

  if (!membership) return null

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  return organization
}
