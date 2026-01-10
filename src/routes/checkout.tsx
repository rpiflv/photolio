import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useCartStore } from '../stores/cartStore'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage
})

interface ShippingInfo {
  name: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
}

function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  )
}

function CheckoutContent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  })

  // Pre-fill email from authenticated user
  useEffect(() => {
    if (user?.email) {
      setShippingInfo(prev => ({ ...prev, email: user.email || '' }))
    }
  }, [user])

  const totalPrice = getTotalPrice()
  const shipping = 8.95
  const total = totalPrice + shipping

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setShippingInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      if (!user) {
        throw new Error('You must be logged in to place an order')
      }

      // Save order to database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_email: shippingInfo.email,
          customer_name: shippingInfo.name,
          shipping_address: {
            address: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zip: shippingInfo.zip,
            country: shippingInfo.country,
            phone: shippingInfo.phone
          },
          items: items.map(item => ({
            photo_id: item.photoId,
            photo_title: item.photoTitle,
            product_name: item.product.name,
            product_variant_id: item.product.variant_id,
            quantity: item.quantity,
            price: item.product.price
          })),
          subtotal: totalPrice,
          shipping_cost: shipping,
          total: total,
          status: 'pending',
          printful_order_id: null
        })
        .select()
        .single()

      if (orderError) throw orderError

      // TODO: Integrate Printful order creation
      // Uncomment when ready to automatically create Printful orders
      /*
      try {
        const printfulResult = await createPrintfulOrder({
          orderId: orderData.id,
          recipient: {
            name: shippingInfo.name,
            address1: shippingInfo.address,
            city: shippingInfo.city,
            state_code: shippingInfo.state,
            country_code: shippingInfo.country,
            zip: shippingInfo.zip,
            email: shippingInfo.email,
            phone: shippingInfo.phone
          },
          items: items.map(item => ({
            variant_id: item.product.variant_id,
            quantity: item.quantity,
            photo_url: item.photoUrl // Make sure this is the full S3 URL
          }))
        })

        if (printfulResult.success) {
          // Update order with Printful order ID
          await supabase
            .from('orders')
            .update({
              printful_order_id: printfulResult.printful_order_id,
              printful_status: printfulResult.printful_status,
              status: 'processing'
            })
            .eq('id', orderData.id)
        }
      } catch (printfulError) {
        console.error('Printful order creation failed:', printfulError)
        // Order is saved but Printful failed - you can manually create it later
      }
      */

      // Clear cart
      clearCart()

      // Redirect to success page
      navigate({ to: '/order-success', search: { orderId: orderData.id } })
    } catch (error: any) {
      console.error('Error creating order:', error)
      const errorMessage = error?.message || 'Failed to create order. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    navigate({ to: '/cart' })
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={shippingInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Using your account email</p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    required
                    value={shippingInfo.zip}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    required
                    value={shippingInfo.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.photoTitle} - {item.product.name} x{item.quantity}
                    </span>
                    <span className="text-gray-900 font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                <p>Note: This is a demo order. No payment will be processed at this time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
