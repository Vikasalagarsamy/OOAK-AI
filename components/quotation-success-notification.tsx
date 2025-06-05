'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ExternalLink, X } from 'lucide-react'

interface QuotationSuccessNotificationProps {
  quotationId: number
  clientName: string
  estimatedValue: number
  quotationSlug?: string
  onClose: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export default function QuotationSuccessNotification({
  quotationId,
  clientName,
  estimatedValue,
  quotationSlug,
  onClose,
  autoHide = true,
  autoHideDelay = 5000
}: QuotationSuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Allow fade out animation
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, onClose])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right">
      <Card className="border-2 border-green-200 bg-green-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-green-800 mb-1">
                Quotation Created Successfully!
              </h4>
              <p className="text-sm text-green-700 mb-2">
                Quotation #{quotationId} generated for <strong>{clientName}</strong>
              </p>
              <p className="text-xs text-green-600 mb-3">
                Estimated Value: ₹{estimatedValue.toLocaleString()}
              </p>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    const viewUrl = quotationSlug 
                      ? `/quotation/${quotationSlug}` 
                      : `/quotation/${quotationId}`
                    window.open(viewUrl, '_blank')
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Quotation
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    window.open(`/sales/quotations/edit/${quotationId}`, '_blank')
                  }}
                >
                  Edit Quotation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-100"
                  onClick={() => {
                    setIsVisible(false)
                    setTimeout(onClose, 300)
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onClose, 300)
              }}
              className="text-green-600 hover:text-green-800 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 