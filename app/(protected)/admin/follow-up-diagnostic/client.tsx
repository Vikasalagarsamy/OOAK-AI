"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DiagnosticClient() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Follow-up diagnostic tool will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
