// Spreedly API Client
// Documentation: https://docs.spreedly.com/reference/api/v1/

const SPREEDLY_BASE_URL = 'https://core.spreedly.com/v1'

interface SpreedlyConfig {
  environmentKey: string
  accessSecret: string
}

interface SpreedlyGatewayRequest {
  gateway_type: string
  [key: string]: string | number | boolean | undefined
}

interface SpreedlyTransactionRequest {
  amount: number
  currency_code: string
  payment_method_token: string
  order_id?: string
  description?: string
  email?: string
  ip?: string
  retain_on_success?: boolean
  stored_credential_initiator?: 'cardholder' | 'merchant'
  stored_credential_usage?: 'first' | 'used'
}

export class SpreedlyClient {
  private config: SpreedlyConfig
  private authHeader: string

  constructor(config?: Partial<SpreedlyConfig>) {
    this.config = {
      environmentKey: config?.environmentKey || process.env.SPREEDLY_ENVIRONMENT_KEY || '',
      accessSecret: config?.accessSecret || process.env.SPREEDLY_ACCESS_SECRET || '',
    }

    // Basic auth header
    this.authHeader = Buffer.from(
      `${this.config.environmentKey}:${this.config.accessSecret}`
    ).toString('base64')
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${SPREEDLY_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Basic ${this.authHeader}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.errors?.[0]?.message || 'Request failed',
        }
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Gateway Methods
  async createGateway(gateway: SpreedlyGatewayRequest) {
    return this.request<{ gateway: Record<string, unknown> }>(
      'POST',
      '/gateways.json',
      { gateway }
    )
  }

  async getGateway(token: string) {
    return this.request<{ gateway: Record<string, unknown> }>(
      'GET',
      `/gateways/${token}.json`
    )
  }

  async listGateways() {
    return this.request<{ gateways: Record<string, unknown>[] }>(
      'GET',
      '/gateways.json'
    )
  }

  async redactGateway(token: string) {
    return this.request<{ gateway: Record<string, unknown> }>(
      'PUT',
      `/gateways/${token}/redact.json`
    )
  }

  // Payment Method Methods
  async getPaymentMethod(token: string) {
    return this.request<{ payment_method: Record<string, unknown> }>(
      'GET',
      `/payment_methods/${token}.json`
    )
  }

  async retainPaymentMethod(token: string) {
    return this.request<{ payment_method: Record<string, unknown> }>(
      'PUT',
      `/payment_methods/${token}/retain.json`
    )
  }

  async redactPaymentMethod(token: string) {
    return this.request<{ payment_method: Record<string, unknown> }>(
      'PUT',
      `/payment_methods/${token}/redact.json`
    )
  }

  // Transaction Methods
  async purchase(gatewayToken: string, transaction: SpreedlyTransactionRequest) {
    return this.request<{ transaction: Record<string, unknown> }>(
      'POST',
      `/gateways/${gatewayToken}/purchase.json`,
      { transaction }
    )
  }

  async authorize(gatewayToken: string, transaction: SpreedlyTransactionRequest) {
    return this.request<{ transaction: Record<string, unknown> }>(
      'POST',
      `/gateways/${gatewayToken}/authorize.json`,
      { transaction }
    )
  }

  async capture(transactionToken: string, amount?: number) {
    const body = amount ? { transaction: { amount } } : undefined
    return this.request<{ transaction: Record<string, unknown> }>(
      'POST',
      `/transactions/${transactionToken}/capture.json`,
      body
    )
  }

  async refund(transactionToken: string, amount?: number) {
    const body = amount ? { transaction: { amount } } : undefined
    return this.request<{ transaction: Record<string, unknown> }>(
      'POST',
      `/transactions/${transactionToken}/credit.json`,
      body
    )
  }

  async voidTransaction(transactionToken: string) {
    return this.request<{ transaction: Record<string, unknown> }>(
      'POST',
      `/transactions/${transactionToken}/void.json`
    )
  }

  async getTransaction(token: string) {
    return this.request<{ transaction: Record<string, unknown> }>(
      'GET',
      `/transactions/${token}.json`
    )
  }
}

// Singleton instance
let spreedlyClient: SpreedlyClient | null = null

export function getSpreedlyClient(): SpreedlyClient {
  if (!spreedlyClient) {
    spreedlyClient = new SpreedlyClient()
  }
  return spreedlyClient
}

// Supported gateway types for the form
export const GATEWAY_TYPES = [
  { value: 'demo', label: 'Demo Gateway', description: 'For testing without real payments (DEMO_MODE required)' },
  { value: 'test', label: 'Spreedly Test Gateway', description: 'For testing purposes' },
  { value: 'stripe', label: 'Stripe', description: 'Popular payment processor' },
  { value: 'braintree_blue', label: 'Braintree', description: 'PayPal company' },
  { value: 'authorize_net', label: 'Authorize.Net', description: 'Visa subsidiary' },
  { value: 'nmi', label: 'NMI', description: 'Network Merchants' },
  { value: 'cybersource', label: 'CyberSource', description: 'Visa subsidiary' },
  { value: 'adyen', label: 'Adyen', description: 'Global payment platform' },
  { value: 'worldpay', label: 'Worldpay', description: 'FIS company' },
  { value: 'paypal', label: 'PayPal Commerce', description: 'PayPal checkout' },
  { value: 'checkout_v2', label: 'Checkout.com', description: 'Global payments' },
]

// Card types
export const CARD_TYPES = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'discover', label: 'Discover' },
  { value: 'jcb', label: 'JCB' },
  { value: 'diners_club', label: 'Diners Club' },
]

// Currencies
export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'MXN', label: 'Mexican Peso (MXN)' },
]
