import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Users, Phone, MessageCircle, Target, DollarSign, ClipboardCheck, ArrowRight } from 'lucide-react'

interface TaskSequenceFlowProps {
  currentStep?: number
  quotationValue?: number
  quotationNumber?: string
  clientName?: string
  className?: string
}

interface SequenceStep {
  step: number
  title: string
  description: string
  icon: React.ReactNode
  timing: string
  priority: 'high' | 'medium' | 'low'
  isConditional?: boolean
  condition?: string
}

export function TaskSequenceFlow({ 
  currentStep = 1, 
  quotationValue = 0, 
  quotationNumber = '',
  clientName = '',
  className = '' 
}: TaskSequenceFlowProps) {
  const isHighValue = quotationValue > 100000
  
  // Define the complete sequence
  const baseSequence: SequenceStep[] = [
    {
      step: 1,
      title: "Initial Follow-up Call",
      description: "Confirm quotation receipt and answer initial questions",
      icon: <Phone className="w-4 h-4" />,
      timing: "Within 2 hours",
      priority: isHighValue ? 'high' : 'medium'
    },
    {
      step: 2,
      title: "WhatsApp Check-in",
      description: "Send message asking for quotation review status",
      icon: <MessageCircle className="w-4 h-4" />,
      timing: "After 1 day",
      priority: 'medium'
    },
    {
      step: 3,
      title: "Detailed Discussion",
      description: "Schedule discussion about services and deliverables",
      icon: <Target className="w-4 h-4" />,
      timing: "After 3 days",
      priority: isHighValue ? 'high' : 'medium'
    },
    {
      step: 4,
      title: "Payment Discussion",
      description: "Discuss payment terms and advance payment",
      icon: <DollarSign className="w-4 h-4" />,
      timing: "After 5 days",
      priority: 'high'
    },
    {
      step: 5,
      title: "Final Follow-up",
      description: "Close deal or understand rejection reasons",
      icon: <ClipboardCheck className="w-4 h-4" />,
      timing: "After 7 days",
      priority: isHighValue ? 'high' : 'medium'
    }
  ]

  // Insert Team Discussion for high-value quotations
  const sequence = isHighValue 
    ? [
        baseSequence[0], // Step 1: Initial Call
        {
          step: 2,
          title: "Team Discussion",
          description: "Strategic discussion with sales head for high-value quotation",
          icon: <Users className="w-4 h-4" />,
          timing: "After 1.5 days",
          priority: 'high' as const,
          isConditional: true,
          condition: "High-value quotation only"
        },
        ...baseSequence.slice(1).map(step => ({ ...step, step: step.step + 1 }))
      ]
    : baseSequence

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed'
    if (stepNumber === currentStep) return 'current'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Task Sequence Flow
          {quotationNumber && (
            <Badge variant="outline" className="ml-2">
              {quotationNumber}
            </Badge>
          )}
        </CardTitle>
        {clientName && (
          <p className="text-sm text-muted-foreground">
            Client: {clientName} • Value: ₹{quotationValue.toLocaleString()}
            {isHighValue && (
              <Badge className="ml-2 bg-orange-100 text-orange-800">
                High Value
              </Badge>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sequence.map((step, index) => {
            const status = getStepStatus(step.step)
            const isLast = index === sequence.length - 1
            
            return (
              <div key={step.step} className="relative">
                {/* Step Card */}
                <div className={`
                  border rounded-lg p-4 transition-all duration-200
                  ${status === 'current' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  ${status === 'completed' ? 'bg-green-50 border-green-200' : ''}
                  ${status === 'pending' ? 'bg-gray-50 border-gray-200' : ''}
                `}>
                  <div className="flex items-start gap-3">
                    {/* Step Icon */}
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2
                      ${getStatusColor(status)}
                    `}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : status === 'current' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          Step {step.step}: {step.title}
                        </h4>
                        <Badge className={getPriorityColor(step.priority)}>
                          {step.priority}
                        </Badge>
                        {step.isConditional && (
                          <Badge variant="outline" className="text-xs">
                            Conditional
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.timing}
                        </span>
                        {step.condition && (
                          <span className="text-orange-600">
                            {step.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow to next step */}
                {!isLast && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Sequence Summary */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-medium">
              Step {currentStep} of {sequence.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / sequence.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 