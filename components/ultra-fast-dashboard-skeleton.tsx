import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * ⚡ ULTRA-FAST DASHBOARD SKELETON
 * 
 * Renders instantly (<5ms) while real data loads in background
 * Provides immediate visual feedback during cold starts
 */

export function UltraFastDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with instant loading state */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Wedding Photography Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Stats Cards - Instant render */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Team Members", color: "bg-blue-50" },
          { title: "Departments", color: "bg-green-50" },
          { title: "Active Quotations", color: "bg-purple-50" },
          { title: "User Roles", color: "bg-orange-50" }
        ].map((item, i) => (
          <Card key={i} className={`hover:shadow-lg transition-shadow ${item.color}`}>
            <CardHeader className="pb-2">
              <div className="text-sm font-medium text-gray-600">{item.title}</div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Leads Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Recent Wedding Inquiries</div>
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics - Instant visual feedback */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="text-blue-800 font-semibold">⚡ Loading Performance Analytics...</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {["Load Time", "Cache Status", "API Calls", "Performance Grade"].map((label, i) => (
              <div key={i}>
                <div className="h-8 w-12 bg-blue-200 rounded animate-pulse mx-auto mb-2"></div>
                <div className="text-xs text-blue-700">{label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <div className="h-6 w-40 bg-blue-200 rounded animate-pulse mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 