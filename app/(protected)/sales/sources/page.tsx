import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Users, TrendingUp, Plus, BarChart3, Search } from "lucide-react"

export default function LeadSourcesPage() {
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Lead Sources</h1>
              <p className="text-gray-600">Track and manage lead sources and their performance.</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Source Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Sources */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Total Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-sm text-blue-700 mt-1">Active lead channels</p>
            <Badge variant="default" className="bg-blue-600 mt-2">Active</Badge>
          </CardContent>
        </Card>

        {/* Top Performer */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Best Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">Website Organic</div>
            <p className="text-sm text-green-700 mt-1">45% of total leads</p>
            <Badge variant="default" className="bg-green-600 mt-2">🏆 Top</Badge>
          </CardContent>
        </Card>

        {/* Monthly Leads */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-800 text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">127</div>
            <p className="text-sm text-purple-700 mt-1">New leads generated</p>
            <Badge variant="outline" className="border-purple-600 text-purple-600 mt-2">+23%</Badge>
          </CardContent>
        </Card>

      </div>

      {/* Lead Sources Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lead Source Performance</CardTitle>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Website Organic */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Website Organic Search</div>
                  <div className="text-sm text-gray-600">Google, Bing organic traffic</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">57 leads</div>
                <div className="text-sm text-gray-600">45% share</div>
              </div>
              <Badge className="bg-green-600">🏆 #1</Badge>
            </div>

            {/* Social Media */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Social Media</div>
                  <div className="text-sm text-gray-600">Instagram, Facebook, LinkedIn</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">32 leads</div>
                <div className="text-sm text-gray-600">25% share</div>
              </div>
              <Badge className="bg-blue-600">🥈 #2</Badge>
            </div>

            {/* Referrals */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Client Referrals</div>
                  <div className="text-sm text-gray-600">Word of mouth, recommendations</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">23 leads</div>
                <div className="text-sm text-gray-600">18% share</div>
              </div>
              <Badge className="bg-purple-600">🥉 #3</Badge>
            </div>

            {/* Google Ads */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Globe className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Google Ads</div>
                  <div className="text-sm text-gray-600">Paid search campaigns</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600">15 leads</div>
                <div className="text-sm text-gray-600">12% share</div>
              </div>
              <Badge variant="secondary">#4</Badge>
            </div>

            {/* Other Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Wedding Exhibitions</div>
                  <div className="text-sm text-gray-600">Trade shows, exhibitions</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600">8 leads</div>
                  <div className="text-sm text-gray-500">6%</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Email Marketing</div>
                  <div className="text-sm text-gray-600">Newsletter, campaigns</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600">6 leads</div>
                  <div className="text-sm text-gray-500">5%</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">YouTube</div>
                  <div className="text-sm text-gray-600">Video content, ads</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600">4 leads</div>
                  <div className="text-sm text-gray-500">3%</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Direct Inquiry</div>
                  <div className="text-sm text-gray-600">Phone, walk-in</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600">3 leads</div>
                  <div className="text-sm text-gray-500">2%</div>
                </div>
              </div>

            </div>

          </div>
        </CardContent>
      </Card>

      {/* Source ROI Analysis */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Source ROI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">₹0</div>
              <div className="text-sm text-green-700">Organic Search Cost</div>
              <div className="text-xs text-gray-600 mt-1">Best ROI</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">₹15,000</div>
              <div className="text-sm text-blue-700">Social Media Ads</div>
              <div className="text-xs text-gray-600 mt-1">Good ROI</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">₹25,000</div>
              <div className="text-sm text-orange-700">Google Ads</div>
              <div className="text-xs text-gray-600 mt-1">Moderate ROI</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">₹8,000</div>
              <div className="text-sm text-purple-700">Exhibition Costs</div>
              <div className="text-xs text-gray-600 mt-1">Fair ROI</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const metadata = {
  title: "Lead Sources | OOAK Enterprise",
  description: "Track and manage lead sources and their performance"
} 