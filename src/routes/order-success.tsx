import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle, Package } from 'lucide-react'

export const Route = createFileRoute('/order-success')({
  component: OrderSuccessPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orderId: (search.orderId as string) || ''
    }
  }
})

function OrderSuccessPage() {
  const { orderId } = Route.useSearch()

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            Thank you for your order!
          </p>
          
          {orderId && (
            <p className="text-sm text-gray-500 mb-8">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>
          )}

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              What's Next?
            </h2>
            <div className="text-left space-y-2 text-gray-600">
              <p>✓ You will receive an order confirmation email shortly</p>
              <p>✓ Your prints will be professionally produced by Printful</p>
              <p>✓ Shipping typically takes 5-7 business days</p>
              <p>✓ You'll receive tracking information once shipped</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/gallery"
              className="block w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/"
              className="block w-full text-gray-600 hover:text-gray-900 py-2"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t text-sm text-gray-500">
            <p>
              Questions about your order? Contact us at{' '}
              <a href="mailto:hello@photofolio.com" className="text-gray-900 hover:underline">
                hello@photofolio.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
