'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CallAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Call Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Call analytics will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
