'use client'

import { AIInsightsDashboard } from '@/components/ai-insights/ai-insights-dashboard'
import { TestRealtimeButton } from '@/components/test-realtime-button'
import { Separator } from "@/components/ui/separator"

export default function AIInsightsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Main AI Insights Dashboard */}
      <AIInsightsDashboard />
      
      {/* Separator */}
      <Separator className="my-8" />
      
      {/* Developer Testing Section */}
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">🔧 Developer Testing Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          This section is for testing real-time notifications. Remove this section when ready for production.
        </p>
        <TestRealtimeButton />
      </div>
    </div>
  )
} 