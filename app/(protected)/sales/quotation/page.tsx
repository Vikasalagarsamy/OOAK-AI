"use client"

import { useEffect } from "react"

export default function QuotationOldRedirectPage() {
  
  useEffect(() => {
    // Redirect to the new URL
    window.location.replace('/sales/quotations')
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to quotations...</p>
      </div>
    </div>
  )
} 