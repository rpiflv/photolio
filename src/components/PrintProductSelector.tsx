import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { PRINT_PRODUCTS, type PrintProduct } from '../lib/printful'
import { useCartStore } from '../stores/cartStore'

interface PrintProductSelectorProps {
  photoId: string
  photoTitle: string
  photoUrl: string
  onClose: () => void
}

export function PrintProductSelector({
  photoId,
  photoTitle,
  photoUrl,
  onClose
}: PrintProductSelectorProps) {
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const productsByCategory = {
    'Posters': [
      PRINT_PRODUCTS.POSTER_8x10,
      PRINT_PRODUCTS.POSTER_12x16,
      PRINT_PRODUCTS.POSTER_18x24
    ],
    'Framed Prints': [
      PRINT_PRODUCTS.FRAMED_8x10,
      PRINT_PRODUCTS.FRAMED_12x16,
      PRINT_PRODUCTS.FRAMED_18x24
    ],
    'Canvas Prints': [
      PRINT_PRODUCTS.CANVAS_8x10,
      PRINT_PRODUCTS.CANVAS_12x16,
      PRINT_PRODUCTS.CANVAS_18x24
    ]
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return

    addItem({
      photoId,
      photoTitle,
      photoUrl,
      product: selectedProduct,
      quantity
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Select Print Size</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Photo Preview */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <img
              src={photoUrl}
              alt={photoTitle}
              className="w-24 h-24 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{photoTitle}</h3>
              <p className="text-sm text-gray-600">Choose your preferred size and format</p>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="px-6 py-4 space-y-6">
          {Object.entries(productsByCategory).map(([category, products]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.variant_id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedProduct?.variant_id === product.variant_id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with quantity and add to cart */}
        {selectedProduct && (
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x border-gray-300 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart - ${(selectedProduct.price * quantity).toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
