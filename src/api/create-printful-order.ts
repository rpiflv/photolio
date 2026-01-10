/**
 * Server-side API endpoint to create Printful orders
 * This keeps your Printful API key secure
 */

import { createPrintfulService } from '../lib/printful'

interface PrintfulOrderRequest {
  orderId: string
  recipient: {
    name: string
    address1: string
    city: string
    state_code: string
    country_code: string
    zip: string
    email: string
    phone: string
  }
  items: Array<{
    variant_id: number
    quantity: number
    photo_url: string // S3 URL to the high-res photo
  }>
}

export async function createPrintfulOrder(request: PrintfulOrderRequest) {
  try {
    const printful = createPrintfulService()

    // Prepare items with file URLs
    const printfulItems = request.items.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      files: [
        {
          url: item.photo_url
        }
      ]
    }))

    // Create the order in Printful
    const order = {
      recipient: request.recipient,
      items: printfulItems
    }

    // Create draft order first (confirm: false)
    const draftOrder = await printful.createOrder(order, false)

    // Get cost estimation
    const costs = await printful.calculateOrderCosts(order)

    return {
      success: true,
      printful_order_id: draftOrder.id,
      printful_status: draftOrder.status,
      costs: costs
    }
  } catch (error: any) {
    console.error('Printful API Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create Printful order'
    }
  }
}

/**
 * Confirm a draft Printful order (actually submit it for production)
 */
export async function confirmPrintfulOrder(printfulOrderId: string) {
  try {
    const printful = createPrintfulService()
    
    // Confirm the order - this submits it for production
    const confirmedOrder = await printful.createOrder(
      { id: printfulOrderId } as any,
      true
    )

    return {
      success: true,
      order: confirmedOrder
    }
  } catch (error: any) {
    console.error('Printful Confirm Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to confirm Printful order'
    }
  }
}
