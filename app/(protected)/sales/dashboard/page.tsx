import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Target, DollarSign, RefreshCw, BarChart3 } from "lucide-react"

export default function SalesDashboardPage() {
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Sales Dashboard</h1>
              <p className="text-gray-600">Sales performance overview and analytics.</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹12,45,000</div>
            <p className="text-sm text-green-700 mt-1">+12% from last month</p>
            <Badge variant="default" className="bg-green-600 mt-2">↗ Growing</Badge>
          </CardContent>
        </Card>

        {/* Active Leads */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">28</div>
            <p className="text-sm text-blue-700 mt-1">5 new this week</p>
            <Badge variant="secondary" className="bg-blue-600 text-white mt-2">Hot Prospects</Badge>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-800 text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">68%</div>
            <p className="text-sm text-purple-700 mt-1">Above target of 60%</p>
            <Badge variant="outline" className="border-purple-600 text-purple-600 mt-2">Excellent</Badge>
          </CardContent>
        </Card>

        {/* Sales Target */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">85%</div>
            <p className="text-sm text-orange-700 mt-1">₹10.6L of ₹12.5L target</p>
            <Badge variant="default" className="bg-orange-600 mt-2">On Track</Badge>
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Quotations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Wedding Photography - Sharma Family</div>
                  <div className="text-sm text-gray-600">₹2,45,000 • Pending Approval</div>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Pre-Wedding Shoot - Kumar Couple</div>
                  <div className="text-sm text-gray-600">₹85,000 • Approved</div>
                </div>
                <Badge className="bg-green-600">Approved</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Corporate Event - Tech Corp</div>
                  <div className="text-sm text-gray-600">₹1,25,000 • In Review</div>
                </div>
                <Badge variant="secondary">Review</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Sales Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Rajesh Kumar</div>
                  <div className="text-sm text-gray-600">8 deals • ₹4,25,000</div>
                </div>
                <Badge className="bg-gold-600 text-yellow-900">🏆 #1</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Priya Sharma</div>
                  <div className="text-sm text-gray-600">6 deals • ₹3,15,000</div>
                </div>
                <Badge className="bg-silver-600 text-gray-900">🥈 #2</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Amit Patel</div>
                  <div className="text-sm text-gray-600">5 deals • ₹2,85,000</div>
                </div>
                <Badge className="bg-bronze-600 text-amber-900">🥉 #3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Sales Pipeline */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Sales Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-blue-700">New Inquiries</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">8</div>
              <div className="text-sm text-yellow-700">In Discussion</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">6</div>
              <div className="text-sm text-purple-700">Quotation Sent</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">4</div>
              <div className="text-sm text-orange-700">Under Review</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-green-700">Ready to Close</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const metadata = {
  title: "Sales Dashboard | OOAK Enterprise",
  description: "Sales performance overview and analytics for wedding photography business"
} 