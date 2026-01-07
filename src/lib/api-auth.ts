import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface ApiAuthResult {
  success: boolean
  apiKeyId?: string
  error?: string
  statusCode?: number
}

/**
 * Validate API key from request headers
 * Expects: Authorization: Bearer <api_key>
 * Or: X-Api-Key: <api_key>
 */
export async function validateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  // Get API key from headers
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')

  let apiKey: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7)
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'Missing API key. Provide via Authorization: Bearer <key> or X-Api-Key header.',
      statusCode: 401
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  // Look up API key
  const { data: apiSettings, error } = await supabase
    .from('api_settings')
    .select('id, is_active, rate_limit_per_minute, rate_limit_per_day, allowed_origins')
    .eq('api_key', apiKey)
    .single()

  if (error || !apiSettings) {
    return {
      success: false,
      error: 'Invalid API key',
      statusCode: 401
    }
  }

  if (!apiSettings.is_active) {
    return {
      success: false,
      error: 'API key is inactive',
      statusCode: 403
    }
  }

  // Check CORS origin if allowed_origins is set
  const origin = request.headers.get('origin')
  if (apiSettings.allowed_origins && apiSettings.allowed_origins.length > 0 && origin) {
    const isAllowed = apiSettings.allowed_origins.some((allowed: string) => {
      if (allowed === '*') return true
      return origin === allowed || origin.endsWith(allowed)
    })

    if (!isAllowed) {
      return {
        success: false,
        error: 'Origin not allowed',
        statusCode: 403
      }
    }
  }

  // Update last_used_at
  await supabase
    .from('api_settings')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiSettings.id)

  return {
    success: true,
    apiKeyId: apiSettings.id
  }
}

/**
 * Log API request
 */
export async function logApiRequest(params: {
  apiKeyId: string | null
  endpoint: string
  method: string
  requestBody?: unknown
  responseStatus: number
  responseBody?: unknown
  ipAddress?: string
  userAgent?: string
  durationMs: number
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  await supabase.from('api_request_log').insert({
    api_key_id: params.apiKeyId,
    endpoint: params.endpoint,
    method: params.method,
    request_body: params.requestBody as object,
    response_status: params.responseStatus,
    response_body: params.responseBody as object,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    duration_ms: params.durationMs
  })
}

/**
 * Create API error response
 */
export function apiError(message: string, statusCode: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: statusCode }
  )
}

/**
 * Create API success response
 */
export function apiSuccess<T>(data: T, statusCode: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status: statusCode }
  )
}

/**
 * Wrapper for API routes that require authentication
 */
export function withApiAuth(
  handler: (request: NextRequest, apiKeyId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const auth = await validateApiKey(request)

    if (!auth.success) {
      const response = apiError(auth.error!, auth.statusCode!)

      // Log failed auth attempt
      await logApiRequest({
        apiKeyId: null,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        responseStatus: auth.statusCode!,
        responseBody: { error: auth.error },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        durationMs: Date.now() - startTime
      })

      return response
    }

    try {
      const response = await handler(request, auth.apiKeyId!)

      // Log successful request
      const responseBody = await response.clone().json().catch(() => null)
      await logApiRequest({
        apiKeyId: auth.apiKeyId!,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        responseStatus: response.status,
        responseBody,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        durationMs: Date.now() - startTime
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error'
      const response = apiError(errorMessage, 500)

      await logApiRequest({
        apiKeyId: auth.apiKeyId!,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        responseStatus: 500,
        responseBody: { error: errorMessage },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        durationMs: Date.now() - startTime
      })

      return response
    }
  }
}
