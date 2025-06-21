"use client"

import React from "react"

interface EnhancedQuotationReviewProps {
  quotationId: string
  onClose?: () => void
}

export default function EnhancedQuotationReview({ quotationId, onClose }: EnhancedQuotationReviewProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Quotation Review</h3>
      <p className="text-gray-600 mb-4">Quotation ID: {quotationId}</p>
      <p className="text-gray-600">This enhanced review feature is being updated for production deployment.</p>
      {onClose && (
        <button 
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      )}
    </div>
  )
} 