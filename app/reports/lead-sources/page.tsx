import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadSourceReport } from "@/components/reports/lead-source-report"

export const metadata: Metadata = {
  title: "Lead Source Analysis",
  description: "Analyze performance of different lead sources",
}

export default function LeadSourcesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead Source Analysis</CardTitle>
          <CardDescription>Compare the performance of different lead acquisition channels</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadSourceReport />
        </CardContent>
      </Card>
    </div>
  )
}
