'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Users, CheckCircle, FileText, DollarSign } from 'lucide-react'

interface BusinessFlowSummaryProps {
  stats: {
    totalLeads: number
    assignedLeads: number
    activeTasks: number
    completedTasks: number
    generatedQuotations: number
    totalRevenuePotential: number
  }
}

export default function BusinessFlowSummary({ stats }: BusinessFlowSummaryProps) {
  const flowSteps = [
    {
      title: 'Unassigned Leads',
      count: stats.totalLeads - stats.assignedLeads,
      icon: Users,
      color: 'bg-gray-100 text-gray-600',
      description: 'New leads waiting for assignment'
    },
    {
      title: 'Assigned Leads',
      count: stats.assignedLeads,
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-600',
      description: 'Leads assigned to team members'
    },
    {
      title: 'AI Tasks',
      count: stats.activeTasks + stats.completedTasks,
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Automated follow-up tasks'
    },
    {
      title: 'Completed Tasks',
      count: stats.completedTasks,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      description: 'Tasks ready for quotation'
    },
    {
      title: 'Generated Quotations',
      count: stats.generatedQuotations,
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600',
      description: 'Quotations sent to clients'
    }
  ]

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Business Flow Overview</CardTitle>
        <p className="text-sm text-gray-600">
          End-to-end lead to quotation pipeline with AI task automation
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between space-x-2 mb-4 overflow-x-auto pb-2">
          {flowSteps.map((step, index) => (
            <div key={step.title} className="flex items-center flex-shrink-0">
              <div className="text-center min-w-[120px]">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mx-auto mb-2`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="mb-1 text-xs">
                  {step.count}
                </Badge>
                <p className="text-xs font-medium text-gray-900 mb-1">{step.title}</p>
                <p className="text-xs text-gray-500 leading-tight">{step.description}</p>
              </div>
              
              {index < flowSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              ₹{stats.totalRevenuePotential.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">Revenue Potential</p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {Math.round((stats.completedTasks / Math.max(stats.activeTasks + stats.completedTasks, 1)) * 100)}%
            </p>
            <p className="text-xs text-gray-600">Task Completion Rate</p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">
              {Math.round((stats.generatedQuotations / Math.max(stats.completedTasks, 1)) * 100)}%
            </p>
            <p className="text-xs text-gray-600">Task to Quotation Rate</p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold text-orange-600">
              {stats.activeTasks}
            </p>
            <p className="text-xs text-gray-600">Active Tasks</p>
          </div>
        </div>
        
        {/* Business Impact */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-1">
            🚀 AI Task Automation Impact
          </p>
          <p className="text-xs text-blue-600">
            Replacing manual follow-ups with intelligent task management • 
            Zero leads lost • Complete audit trail • Automated quotation generation
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 