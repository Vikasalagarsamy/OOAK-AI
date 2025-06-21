'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApprovalsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sales approvals will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
