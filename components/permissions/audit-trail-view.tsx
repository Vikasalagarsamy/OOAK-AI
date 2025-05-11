"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getAuditTrail } from "@/services/permissions-service"
import type { AuditTrail } from "@/types/permissions"

interface AuditTrailViewProps {
  entityType: string
  entityId: string
  limit?: number
}

export function AuditTrailView({ entityType, entityId, limit = 10 }: AuditTrailViewProps) {
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAuditTrail = async () => {
      setLoading(true)
      try {
        const data = await getAuditTrail(entityType, entityId, limit)
        setAuditTrail(data)
      } catch (error) {
        console.error("Error loading audit trail:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAuditTrail()
  }, [entityType, entityId, limit])

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (auditTrail.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No audit records found for this entity.</div>
  }

  return (
    <div className="space-y-4 mt-4">
      {auditTrail.map((audit) => (
        <Card key={audit.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Badge variant={getActionVariant(audit.action)}>{audit.action}</Badge>
                  <span>{new Date(audit.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">User: {audit.user_id || "System"}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Previous Values</h4>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(audit.old_values, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">New Values</h4>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(audit.new_values, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getActionVariant(action: string): "default" | "destructive" | "outline" | "secondary" {
  switch (action.toLowerCase()) {
    case "create":
      return "default"
    case "update":
      return "secondary"
    case "delete":
      return "destructive"
    default:
      return "outline"
  }
}
