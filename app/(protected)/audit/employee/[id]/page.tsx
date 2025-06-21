'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EmployeeAuditPageProps {
  params: Promise<{ id: string }>
}

export default function EmployeeAuditPage({ params }: EmployeeAuditPageProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Employee audit details will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
