/**
 * Printful API Integration
 * Documentation: https://developers.printful.com/docs/
 */

const PRINTFUL_API_BASE = 'https://api.printful.com'

// Common photo print products on Printful
export const PRINT_PRODUCTS = {
  POSTER_8x10: { id: 1, variant_id: 4438, name: '8x10" Poster', price: 8.95 },
  POSTER_12x16: { id: 1, variant_id: 4439, name: '12x16" Poster', price: 14.95 },
  POSTER_18x24: { id: 1, variant_id: 4440, name: '18x24" Poster', price: 24.95 },
  FRAMED_8x10: { id: 2, variant_id: 4493, name: '8x10" Framed Print', price: 24.95 },
  FRAMED_12x16: { id: 2, variant_id: 4494, name: '12x16" Framed Print', price: 34.95 },
  FRAMED_18x24: { id: 2, variant_id: 4495, name: '18x24" Framed Print', price: 49.95 },
  CANVAS_8x10: { id: 3, variant_id: 4558, name: '8x10" Canvas', price: 29.95 },
  CANVAS_12x16: { id: 3, variant_id: 4559, name: '12x16" Canvas', price: 39.95 },
  CANVAS_18x24: { id: 3, variant_id: 4560, name: '18x24" Canvas', price: 59.95 }
}

export type PrintProduct = typeof PRINT_PRODUCTS[keyof typeof PRINT_PRODUCTS]

interface PrintfulOrder {
  recipient: {
    name: string
    address1: string
    city: string
    state_code: string
    country_code: string
    zip: string
    email?: string
    phone?: string
  }
  items: Array<{
    variant_id: number
    quantity: number
    files: Array<{
      url: string
    }>
  }>
}

export class PrintfulService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${PRINTFUL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Printful API error: ${response.status} - ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  /**
   * Get shipping rates for an order
   */
  async getShippingRates(order: PrintfulOrder) {
    const response = await this.request('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify(order)
    })
    return response.result
  }

  /**
   * Create an order
   */
  async createOrder(order: PrintfulOrder, confirm = false) {
    const response = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...order,
        confirm
      })
    })
    return response.result
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string) {
    const response = await this.request(`/orders/${orderId}`)
    return response.result
  }

  /**
   * Calculate order costs
   */
  async calculateOrderCosts(order: PrintfulOrder) {
    const response = await this.request('/orders/estimate-costs', {
      method: 'POST',
      body: JSON.stringify(order)
    })
    return response.result
  }

  /**
   * Get product details
   */
  async getProduct(productId: number) {
    const response = await this.request(`/products/${productId}`)
    return response.result
  }

  /**
   * Get variant details
   */
  async getVariant(variantId: number) {
    const response = await this.request(`/products/variant/${variantId}`)
    return response.result
  }
}

// Helper to create Printful service instance
export function createPrintfulService() {
  const apiKey = import.meta.env.VITE_PRINTFUL_API_KEY
  if (!apiKey) {
    throw new Error('VITE_PRINTFUL_API_KEY is not set')
  }
  return new PrintfulService(apiKey)
}
