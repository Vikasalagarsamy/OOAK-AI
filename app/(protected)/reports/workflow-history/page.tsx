'use client'

import { useState } from 'react'
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function WorkflowHistoryReportPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader title="Workflow History" />
      <ReportsSubmenu />
      
      <Card>
        <CardHeader>
          <CardTitle>Workflow History Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Workflow history reporting will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
