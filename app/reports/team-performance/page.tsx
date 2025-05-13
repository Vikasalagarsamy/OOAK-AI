import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"

export const metadata: Metadata = {
  title: "Team Performance Analysis",
  description: "Compare sales team performance metrics",
}

export default function TeamPerformancePage() {
  return (
    <div className="space-y-6">
      <ReportsHeader
        title="Team Performance"
        description="Compare and analyze performance metrics across your sales team"
      />

      <ReportsSubmenu />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion by Team Member</CardTitle>
            <CardDescription>Compare lead conversion rates across sales team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Conversion rate chart will be implemented in the next phase</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads Handled</CardTitle>
            <CardDescription>Lead volume by team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Lead volume chart will be implemented in the next phase</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detailed Team Metrics</CardTitle>
            <CardDescription>Comprehensive view of team performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
                <TabsTrigger value="volume">Lead Volume</TabsTrigger>
                <TabsTrigger value="time">Response Time</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Team overview metrics will be implemented in the next phase</p>
                </div>
              </TabsContent>

              <TabsContent value="conversion">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">
                    Detailed conversion metrics will be implemented in the next phase
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="volume">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Lead volume metrics will be implemented in the next phase</p>
                </div>
              </TabsContent>

              <TabsContent value="time">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Response time metrics will be implemented in the next phase</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
