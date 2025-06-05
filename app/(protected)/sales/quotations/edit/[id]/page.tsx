"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { getQuotation, type SavedQuotation } from "@/actions/quotations-actions"
import { QuotationGeneratorSteps } from "@/components/quotations/quotation-generator-steps"
import { toast } from "@/components/ui/use-toast"

interface EditQuotationPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { id } = React.use(params)
  const [quotation, setQuotation] = useState<SavedQuotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuotation()
  }, [id])

  const loadQuotation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getQuotation(id)
      
      if (result.success && result.quotation) {
        setQuotation(result.quotation)
      } else {
        setError(result.error || "Failed to load quotation")
        toast({
          title: "Error",
          description: result.error || "Failed to load quotation",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error loading quotation:", err)
      setError("Failed to load quotation")
      toast({
        title: "Error",
        description: "Failed to load quotation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <Link href="/sales/quotations">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading quotation...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <Link href="/sales/quotations">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-red-500" />
              Error Loading Quotation
            </CardTitle>
            <CardDescription>
              Unable to load quotation for editing
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Link href="/sales/quotations">
                  <Button variant="outline">
                    Back to Quotations
                  </Button>
                </Link>
                <Button onClick={loadQuotation}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Create mock lead object from quotation data
  const mockLead = {
    id: quotation.lead_id,
    client_name: quotation.client_name,
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/sales/quotations">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          <Edit className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold">Edit Quotation</h1>
            <p className="text-muted-foreground">
              Editing {quotation.quotation_number} for {quotation.client_name}
            </p>
          </div>
        </div>
      </div>

      <QuotationGeneratorSteps 
        lead={mockLead} 
        followUpId={quotation.follow_up_id?.toString() || null}
        editMode={true}
        existingQuotation={quotation}
      />
    </div>
  )
} 