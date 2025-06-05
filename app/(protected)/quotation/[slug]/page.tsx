"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getQuotationBySlug, type SavedQuotation } from "@/actions/quotations-actions"
import { TemplateRenderer } from "@/components/quotation-templates"

interface QuotationViewPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function QuotationViewPage({ params }: QuotationViewPageProps) {
  const { slug } = React.use(params)
  const searchParams = useSearchParams()
  const [quotation, setQuotation] = useState<SavedQuotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    loadQuotationData()
  }, [slug])

  const loadQuotationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if this is a demo slug
      if (slug.startsWith('demo-')) {
        setIsDemoMode(true)
        // Create minimal demo data that satisfies the type requirements
        const demoQuotation: SavedQuotation = {
          id: 1,
          quotation_number: "QT-DEMO-001",
          slug: slug,
          client_name: "John Smith",
          bride_name: "Sarah Johnson", 
          groom_name: "Michael Chen",
          mobile: "+91 98765 43210",
          email: "sarah.michael@email.com",
          default_package: "premium",
          total_amount: 285000,
          status: "draft",
          created_by: "demo-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          events_count: 2,
          quotation_data: {
            client_name: "John Smith",
            bride_name: "Sarah Johnson",
            groom_name: "Michael Chen", 
            mobile: "9876543210",
            mobile_country_code: "+91",
            email: "sarah.michael@email.com",
            whatsapp: "9876543210",
            whatsapp_country_code: "+91",
            alternate_mobile: "",
            alternate_mobile_country_code: "+91",
            alternate_whatsapp: "",
            alternate_whatsapp_country_code: "+91",
            default_package: "premium",
            service_overrides: {},
            package_overrides: {},
            events: [
              {
                id: "1",
                event_name: "Engagement Ceremony",
                event_date: new Date("2024-02-14"),
                event_location: "Mumbai, Maharashtra",
                venue_name: "Royal Banquet Hall",
                start_time: "18:00",
                end_time: "22:00",
                expected_crowd: "150",
                selected_package: "premium",
                selected_services: [{ id: 1, quantity: 2 }],
                selected_deliverables: [{ id: 1, quantity: 1 }],
                service_overrides: {},
                package_overrides: {}
              },
              {
                id: "2", 
                event_name: "Wedding Ceremony",
                event_date: new Date("2024-03-15"),
                event_location: "Mumbai, Maharashtra",
                venue_name: "Grand Palace Resort",
                start_time: "06:00",
                end_time: "14:00",
                expected_crowd: "300",
                selected_package: "premium",
                selected_services: [{ id: 1, quantity: 3 }],
                selected_deliverables: [{ id: 1, quantity: 2 }],
                service_overrides: {},
                package_overrides: {}
              }
            ],
            selected_services: [{ id: 1, quantity: 2 }],
            selected_deliverables: [{ id: 1, quantity: 1 }]
          }
        }
        setQuotation(demoQuotation)
        setLoading(false)
        return
      }
      
      const result = await getQuotationBySlug(slug)
      
      if (result.success && result.quotation) {
        setQuotation(result.quotation)
      } else {
        setError("Quotation not found or expired")
      }
    } catch (err: any) {
      console.error("Error loading quotation:", err)
      setError("Failed to load quotation")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading your quotation...</p>
        </div>
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Quotation Not Found</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          {!isDemoMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm mb-2">Want to test the templates?</p>
              <p className="text-blue-600 text-xs">
                Try using a demo URL: <br />
                <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                  /quotation/demo-template?template=modern-gradient
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Get template from query parameter or use default
  const selectedTemplateId = searchParams.get('template') || 'original'

  return (
    <div>
      {isDemoMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
          <p className="text-yellow-800 text-sm">
            🎨 <strong>Demo Mode:</strong> You're viewing a sample quotation with template "{selectedTemplateId}"
          </p>
        </div>
      )}
      <TemplateRenderer
        templateId={selectedTemplateId}
        quotation={quotation}
        showEventTracking={false}
        showDeliverableTracking={false}
        companySettings={{
          companyName: "Your Photography Studio",
          brandColor: "blue",
          contactInfo: {
            phone: "+91 98765 43210",
            email: "info@yourphotostudio.com",
            website: "www.yourphotostudio.com"
          }
        }}
      />
    </div>
  )
} 