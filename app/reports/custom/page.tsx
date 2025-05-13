import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"
import { Plus, Filter, Download, Save } from "lucide-react"

export const metadata: Metadata = {
  title: "Custom Reports",
  description: "Create and save custom report configurations",
}

export default function CustomReportsPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader
        title="Custom Reports"
        description="Create, save, and run customized reports based on your specific needs"
      />

      <ReportsSubmenu />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Saved Reports</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle>Monthly Conversion by Source</CardTitle>
            <CardDescription>Last modified: 3 days ago</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Shows conversion rates by lead source over the last 30 days
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle>Team Performance Q3</CardTitle>
            <CardDescription>Last modified: 1 week ago</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Detailed breakdown of team performance metrics for Q3</p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center p-6">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground font-medium">Create New Report</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Builder</CardTitle>
          <CardDescription>Configure your custom report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="text-center">
              <Plus className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Click "Create New Report" to start building a custom report</p>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
