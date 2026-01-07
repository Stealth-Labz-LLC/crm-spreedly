import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
// Note: /api/v1/* routes use API key auth instead of session auth
const publicRoutes = [
  '/checkout',
  '/api/checkout',
  '/api/v1',
]

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth checks for public routes (checkout flow)
  if (isPublicRoute(request.nextUrl.pathname)) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard and settings routes
  const protectedPaths = ['/dashboard', '/customers', '/products', '/campaigns', '/orders', '/leads', '/gateways', '/transactions', '/settings']
  const isProtectedRoute = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check organization context for authenticated users on protected routes
  if (user && isProtectedRoute && request.nextUrl.pathname !== '/select-organization') {
    try {
      // Get user profile to check for current_organization_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_organization_id')
        .eq('id', user.id)
        .single()

      // If no profile or no organization selected, redirect to organization selector
      if (!profile || !profile.current_organization_id) {
        const url = request.nextUrl.clone()
        url.pathname = '/select-organization'
        return NextResponse.redirect(url)
      }

      // Verify user is an active member of the organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('status')
        .eq('user_id', user.id)
        .eq('organization_id', profile.current_organization_id)
        .eq('status', 'active')
        .single()

      if (!membership) {
        // User is not a member or membership is not active
        const url = request.nextUrl.clone()
        url.pathname = '/select-organization'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If there's an error checking organization, redirect to selector
      console.error('Organization check error in middleware:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/select-organization'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
