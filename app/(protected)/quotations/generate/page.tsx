"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function QuotationRedirectComponent() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Redirect to the new URL with all query parameters
    const newUrl = `/sales/quotations/generate?${searchParams.toString()}`
    window.location.replace(newUrl)
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to quotations...</p>
      </div>
    </div>
  )
}

export default function QuotationRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <QuotationRedirectComponent />
    </Suspense>
  )
} 