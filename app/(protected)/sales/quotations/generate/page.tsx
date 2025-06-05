"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { QuotationGeneratorSteps } from "@/components/quotations/quotation-generator-steps"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getLeadWithDetails } from "@/utils/lead-utils"
import type { Lead } from "@/types/follow-up"

function GenerateQuotationContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get("leadId")
  const followUpId = searchParams.get("followUpId")
  const taskId = searchParams.get("taskId")
  const clientName = searchParams.get("clientName")
  const source = searchParams.get("source")
  const aiContextParam = searchParams.get("aiContext")
  
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiContext, setAiContext] = useState<any>(null)

  useEffect(() => {
    // Parse AI context if it exists
    if (aiContextParam) {
      try {
        // Use decodeURIComponent instead of atob for safer Unicode handling
        const decodedContext = JSON.parse(decodeURIComponent(aiContextParam))
        setAiContext(decodedContext)
        console.log('🧠 AI Context loaded from task:', decodedContext)
      } catch (error) {
        console.error('Failed to parse AI context:', error)
        // Fallback: still try the old base64 method for backwards compatibility
        try {
          const decodedContext = JSON.parse(atob(aiContextParam))
          setAiContext(decodedContext)
          console.log('🧠 AI Context loaded from task (base64 fallback):', decodedContext)
        } catch (fallbackError) {
          console.error('Failed to parse AI context with fallback method:', fallbackError)
          toast({
            title: "Context Loading Warning",
            description: "Could not load task context. Please proceed with manual data entry.",
            variant: "destructive",
          })
        }
      }
    }

    if (leadId) {
      loadLeadDetails(leadId)
    } else {
      setLoading(false)
      toast({
        title: "Error",
        description: "Lead ID is required to generate quotation",
        variant: "destructive",
      })
    }
  }, [leadId, aiContextParam])

  async function loadLeadDetails(id: string) {
    try {
      const leadData = await getLeadWithDetails(id)
      setLead(leadData)
    } catch (error) {
      console.error("Error loading lead details:", error)
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading lead details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="w-full px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Not Found</CardTitle>
            <CardDescription>
              Unable to load lead details. Please check the lead ID and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Generate Quotation</h1>
            <p className="text-muted-foreground">
              Create a comprehensive quotation for {clientName || lead.client_name} (Lead #{lead.lead_number})
            </p>
          </div>
          {source === 'task_completion' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Generated from AI Task
            </Badge>
          )}
        </div>
        
        {/* AI Context Display */}
        {aiContext && (
          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">
                🧠 AI Task Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-blue-700">Task:</strong> {aiContext.task_title}
                </div>
                <div>
                  <strong className="text-blue-700">Budget Range:</strong> {aiContext.budget_range}
                </div>
                <div>
                  <strong className="text-blue-700">Timeline:</strong> {aiContext.timeline}
                </div>
                <div>
                  <strong className="text-blue-700">Urgency:</strong> {aiContext.urgency}
                </div>
                <div className="md:col-span-2">
                  <strong className="text-blue-700">Requirements:</strong> {aiContext.client_requirements}
                </div>
                {aiContext.completion_notes && (
                  <div className="md:col-span-2">
                    <strong className="text-blue-700">Completion Notes:</strong> {aiContext.completion_notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <QuotationGeneratorSteps 
        lead={lead} 
        followUpId={followUpId}
        aiContext={aiContext}
        taskId={taskId}
      />
    </div>
  )
}

export default function GenerateQuotationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <GenerateQuotationContent />
    </Suspense>
  )
} 