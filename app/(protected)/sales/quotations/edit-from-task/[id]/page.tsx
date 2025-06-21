"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getQuotation, type SavedQuotation } from "@/actions/quotations-actions"
import { QuotationGeneratorSteps } from "@/components/quotations/quotation-generator-steps"
import { toast } from "@/components/ui/use-toast"

interface EditQuotationFromTaskPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditQuotationFromTaskPage({ params }: EditQuotationFromTaskPageProps) {
  const { id } = React.use(params)
  const searchParams = useSearchParams()
  const taskId = searchParams.get('task_id')
  
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

  const handleTaskCompletion = async () => {
    if (!taskId) return
    
    try {
      // Auto-complete the current task when quotation is successfully edited
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completion_notes: `Quotation ${quotation?.quotation_number} edited and submitted for approval`,
          updated_by: 'Employee'
        })
      })

      if (response.ok) {
        console.log('✅ Task auto-completed after quotation edit')
        toast({
          title: "Task Completed",
          description: "Your task has been automatically completed",
        })
      }
    } catch (error) {
      console.error('❌ Error completing task:', error)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <Link href="/tasks/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
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
          <Link href="/tasks/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
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
                <Link href="/tasks/dashboard">
                  <Button variant="outline">
                    Back to Tasks
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
        <Link href="/tasks/dashboard">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        
        {/* Task-based edit header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Task-Based Quotation Edit</h2>
              <p className="text-blue-700 text-sm">
                Editing through task workflow - changes will be submitted for approval
                {taskId && <span className="ml-2 font-medium">Task ID: {taskId}</span>}
              </p>
            </div>
          </div>
        </div>
        
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
        taskId={taskId || undefined}
      />
    </div>
  )
} 