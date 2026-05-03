'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ShoppingCart, MessageCircle } from 'lucide-react'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Checkout error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Checkout Error
          </h2>
          <p className="text-gray-600 mb-6">
            Something went wrong while placing your order. Don&apos;t worry — your cart items are safe. Please try again.
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={reset}
              className="bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/?page=cart'}
              className="flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Back to Cart
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center gap-2 text-gray-500"
            >
              <MessageCircle className="w-4 h-4" />
              Contact us on WhatsApp for help
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
