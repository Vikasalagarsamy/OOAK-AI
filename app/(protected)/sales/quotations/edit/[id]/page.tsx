"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface EditQuotationPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { id } = React.use(params)

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

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Direct Quotation Editing Blocked
          </CardTitle>
          <CardDescription className="text-base">
            For better workflow control and approval management
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              🔒 Enhanced Security Policy
            </h3>
            <p className="text-blue-800 text-sm">
              All quotation edits must now go through the task management system to ensure proper approval workflow and audit trail.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">To edit this quotation:</h4>
            <div className="grid gap-3 text-left">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Check Your Tasks</p>
                  <p className="text-sm text-gray-600">Look for quotation-related tasks in your dashboard</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Edit Through Task</p>
                  <p className="text-sm text-gray-600">Use the "Edit Quotation" button in your assigned task</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Automatic Approval</p>
                  <p className="text-sm text-gray-600">Changes will be submitted for approval automatically</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-4">
            <Link href="/tasks/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Go to My Tasks
              </Button>
            </Link>
            <Link href="/sales/quotations">
              <Button variant="outline">
                View All Quotations
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Quotation ID: {id}</p>
            <p>This policy ensures all changes are properly tracked and approved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 