import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadSourceReport } from "@/components/reports/lead-source-report"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"

export const metadata: Metadata = {
  title: "Lead Source Analysis",
  description: "Analyze performance of different lead sources",
}

export default function LeadSourcesPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader
        title="Lead Source Analysis"
        description="Compare the performance of different lead acquisition channels"
      />

      <ReportsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Lead Source Performance</CardTitle>
          <CardDescription>Distribution and conversion rates by lead source</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadSourceReport />
        </CardContent>
      </Card>
    </div>
  )
}
