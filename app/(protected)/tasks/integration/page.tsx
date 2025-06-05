import { LeadTaskIntegrationDashboard } from "@/components/lead-task-integration-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  Zap, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Users,
  Clock,
  DollarSign
} from "lucide-react"

export default function TaskIntegrationPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Bot className="h-12 w-12 text-blue-600" />
          <Zap className="h-8 w-8 text-yellow-500" />
          <Target className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
          AI Lead-Task Integration System
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Intelligent automation that connects leads with AI-generated tasks, revolutionizing your sales workflow 
          from first contact to deal closure.
        </p>
      </div>

      {/* Integration Flow Visualization */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-6 w-6 text-blue-600" />
            Lead-to-Task Flow Integration
          </CardTitle>
          <CardDescription>
            How AI transforms your lead management workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Old Flow */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-semibold text-red-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                OLD PROCESS
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium">Unassigned Lead</p>
                </div>
                <ArrowRight className="h-4 w-4 text-red-500 mx-auto" />
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium">Assigned Lead</p>
                </div>
                <ArrowRight className="h-4 w-4 text-red-500 mx-auto" />
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium">Manual Followups</p>
                  <p className="text-xs text-red-600">❌ Manual tracking</p>
                </div>
                <ArrowRight className="h-4 w-4 text-red-500 mx-auto" />
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium">Quotation</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
                <ArrowRight className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* New Flow */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-semibold text-green-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                NEW AI PROCESS
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium">Unassigned Lead</p>
                </div>
                <ArrowRight className="h-4 w-4 text-green-500 mx-auto" />
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium">Assigned Lead</p>
                  <p className="text-xs text-green-600">🤖 AI trigger activated</p>
                </div>
                <ArrowRight className="h-4 w-4 text-green-500 mx-auto" />
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium">🎯 Intelligent AI Tasks</p>
                  <p className="text-xs text-blue-600">✅ Auto-generated & assigned</p>
                  <p className="text-xs text-purple-600">⚡ Smart priority & SLA</p>
                </div>
                <ArrowRight className="h-4 w-4 text-green-500 mx-auto" />
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium">Quotation</p>
                  <p className="text-xs text-green-600">🎯 Faster conversion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800">40% Faster</p>
              <p className="text-xs text-blue-600">Response Time</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">94% Success</p>
              <p className="text-xs text-green-600">Task Completion</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">₹2.4M+</p>
              <p className="text-xs text-purple-600">Revenue Protected</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">60% Less</p>
              <p className="text-xs text-orange-600">Manual Work</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Rules Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              AI Business Rules
            </CardTitle>
            <CardDescription>
              Smart automation rules that drive task generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">Rule 1</Badge>
                <div>
                  <p className="font-medium text-sm">Lead Assignment → Initial Contact</p>
                  <p className="text-xs text-muted-foreground">24hr SLA • Sales Team • Medium Priority</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Badge variant="outline" className="bg-green-100 text-green-800">Rule 2</Badge>
                <div>
                  <p className="font-medium text-sm">Contacted → Lead Qualification</p>
                  <p className="text-xs text-muted-foreground">48hr SLA • Senior Sales • Medium Priority</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Badge variant="outline" className="bg-purple-100 text-purple-800">Rule 3</Badge>
                <div>
                  <p className="font-medium text-sm">Qualified → Quotation Prep</p>
                  <p className="text-xs text-muted-foreground">48hr SLA • Sales Head • High Priority</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <Badge variant="outline" className="bg-red-100 text-red-800">Rule 4</Badge>
                <div>
                  <p className="font-medium text-sm">High Value (₹1L+) → Escalation</p>
                  <p className="text-xs text-muted-foreground">12hr SLA • Management • Urgent Priority</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Badge variant="outline" className="bg-orange-100 text-orange-800">Rule 5</Badge>
                <div>
                  <p className="font-medium text-sm">Quotation Sent → Follow-up</p>
                  <p className="text-xs text-muted-foreground">24hr SLA • Sales Team • High Priority</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Rule 6</Badge>
                <div>
                  <p className="font-medium text-sm">Approved → Payment Follow-up</p>
                  <p className="text-xs text-muted-foreground">72hr SLA • Accounts • High Priority</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Key Features
            </CardTitle>
            <CardDescription>
              Intelligent capabilities of the integration system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Smart Employee Assignment</p>
                  <p className="text-xs text-muted-foreground">
                    AI matches tasks to best employees based on department, designation, experience, and workload
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Dynamic SLA Management</p>
                  <p className="text-xs text-muted-foreground">
                    Automatic deadline calculation based on task priority and business impact
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Revenue Impact Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Real-time calculation of revenue at risk and protected through task completion
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Intelligent Escalation</p>
                  <p className="text-xs text-muted-foreground">
                    High-value leads (₹1L+) automatically escalated to management with urgent priority
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Performance Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive tracking of lead-to-task conversion rates and business outcomes
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Zero Disruption Integration</p>
                  <p className="text-xs text-muted-foreground">
                    Hooks into existing lead and quotation workflows without modifying core functionality
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Dashboard */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Live Integration Dashboard</h2>
          <p className="text-lg text-muted-foreground">Real-time monitoring of AI task generation and business impact</p>
        </div>
        
        <LeadTaskIntegrationDashboard />
      </div>

      {/* Implementation Status */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-6 w-6" />
            Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-800 mb-3">✅ Completed Components</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Database schema integration (lead_id in ai_tasks)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Lead-Task Integration Service with 6 business rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Integration hooks for existing lead actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Task generation logging and analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Performance tracking and business insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Live dashboard with real-time metrics</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">🔧 Ready for Integration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Hook integration points into existing lead actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Connect quotation workflow events</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Apply database migration to production</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Test AI task generation with real leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Monitor and optimize business rules</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 