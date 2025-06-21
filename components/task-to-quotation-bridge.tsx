'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ArrowRight, FileText, DollarSign, Clock, User } from 'lucide-react'

interface TaskQuotationBridgeProps {
  task: {
    id: string
    title: string | null
    client_name: string | null
    lead_id?: number
    completion_notes?: string | null
    estimated_value?: number | null
    business_impact?: string | null
  }
  onGenerateQuotation: (taskId: string, quotationData: any) => void
  onSkip: () => void
}

export default function TaskQuotationBridge({ task, onGenerateQuotation, onSkip }: TaskQuotationBridgeProps) {
  const [clientRequirements, setClientRequirements] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [projectScope, setProjectScope] = useState('')
  const [timeline, setTimeline] = useState('')
  const [urgency, setUrgency] = useState<'standard' | 'urgent' | 'asap'>('standard')
  const [loading, setLoading] = useState(false)

  const handleGenerateQuotation = async () => {
    setLoading(true)
    
    // Sanitize input data to prevent encoding issues
    const sanitizeText = (text: string | undefined | null) => {
      if (!text) return ''
      return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .trim()
    }
    
    const quotationData = {
      lead_id: task.lead_id,
      client_name: sanitizeText(task.client_name),
      task_id: task.id,
      context: {
        task_title: sanitizeText(task.title),
        completion_notes: sanitizeText(task.completion_notes),
        client_requirements: sanitizeText(clientRequirements),
        budget_range: sanitizeText(budgetRange),
        project_scope: sanitizeText(projectScope),
        timeline: sanitizeText(timeline),
        urgency: urgency,
        estimated_value: task.estimated_value || 0,
        business_impact: sanitizeText(task.business_impact),
        source: 'task_completion'
      }
    }
    
    await onGenerateQuotation(task.id, quotationData)
    setLoading(false)
  }

  return (
    <Card className="border-2 border-green-200 bg-green-50" data-bridge="quotation-bridge">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-green-800">Task Completed Successfully!</CardTitle>
              <p className="text-sm text-green-600">Ready to generate quotation for {task.client_name || 'Client'}</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">
            <ArrowRight className="w-4 h-4 mr-1" />
            Next: Quotation
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Task Summary */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Task Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Task:</span>
              <p className="font-medium">{task.title || 'Untitled Task'}</p>
            </div>
            <div>
              <span className="text-gray-600">Client:</span>
              <p className="font-medium">{task.client_name || 'Unknown Client'}</p>
            </div>
            <div>
              <span className="text-gray-600">Completion Notes:</span>
              <p className="text-gray-800">{task.completion_notes || 'No notes provided'}</p>
            </div>
            <div>
              <span className="text-gray-600">Estimated Value:</span>
              <p className="font-medium text-green-600">₹{task.estimated_value?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Quotation Context Form */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Add Quotation Context</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Requirements Discussed
            </label>
            <Textarea
              placeholder="What specific requirements did the client mention? (e.g., website features, design preferences, functionality needs)"
              value={clientRequirements}
              onChange={(e) => setClientRequirements(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Range Mentioned
              </label>
              <Input
                placeholder="₹50,000 - ₹100,000"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeline Required
              </label>
              <Input
                placeholder="2-3 weeks, 1 month"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Scope Details
            </label>
            <Textarea
              placeholder="Detailed scope of work discussed (e.g., number of pages, integrations, special features)"
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency Level
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'standard', label: 'Standard', color: 'bg-blue-100 text-blue-800' },
                { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
                { value: 'asap', label: 'ASAP', color: 'bg-red-100 text-red-800' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUrgency(option.value as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    urgency === option.value 
                      ? option.color + ' ring-2 ring-offset-1 ring-opacity-50' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t">
          <Button 
            onClick={handleGenerateQuotation}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Quotation'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onSkip}
            className="px-6"
          >
            Skip for Now
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <div className="flex items-start space-x-2">
            <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="font-medium text-blue-800">Smart Quotation Generation</p>
              <p className="text-blue-600">
                This information will be used to auto-populate the quotation with relevant details from your conversation with {task.client_name || 'the client'}.
                You can always edit the quotation before sending.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 