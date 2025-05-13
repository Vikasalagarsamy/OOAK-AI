import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"

export const metadata: Metadata = {
  title: "Trend Analysis",
  description: "Analyze lead and conversion trends over time",
}

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader title="Trend Analysis" description="Analyze how your key metrics change over time" />

      <ReportsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Lead Generation Trends</CardTitle>
          <CardDescription>Monitor lead generation volume and patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">
              Lead generation trend visualization will be implemented in the next phase
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trends</CardTitle>
            <CardDescription>How conversion rates have changed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Conversion trend chart will be implemented in the next phase</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Source Distribution</CardTitle>
            <CardDescription>Changes in lead source distribution over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Lead source trend chart will be implemented in the next phase</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seasonal Patterns</CardTitle>
          <CardDescription>Identify seasonal patterns in lead generation and conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="yearly">
            <TabsList className="mb-4">
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>

            <TabsContent value="yearly">
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Yearly pattern analysis will be implemented in the next phase</p>
              </div>
            </TabsContent>

            <TabsContent value="quarterly">
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">
                  Quarterly pattern analysis will be implemented in the next phase
                </p>
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Monthly pattern analysis will be implemented in the next phase</p>
              </div>
            </TabsContent>

            <TabsContent value="weekly">
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Weekly pattern analysis will be implemented in the next phase</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
