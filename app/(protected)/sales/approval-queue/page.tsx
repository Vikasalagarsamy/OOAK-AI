'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApprovalQueuePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Approval queue will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
