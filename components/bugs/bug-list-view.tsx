"use client"
import type { Bug } from "@/types/bug"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react"

interface BugListViewProps {
  bugs: Bug[]
}

export function BugListView({ bugs }: BugListViewProps) {
  // Bug status badge styling
  const getStatusBadge = (status: Bug["status"]) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Open
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" /> Closed
          </Badge>
        )
    }
  }

  // Bug severity badge styling
  const getSeverityBadge = (severity: Bug["severity"]) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Critical
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low
          </Badge>
        )
    }
  }

  return (
    <div>
      {bugs.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-background">
          <h3 className="text-lg font-medium">No bugs found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new bug.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bugs.map((bug) => (
                <TableRow key={bug.id}>
                  <TableCell className="font-mono">{bug.id}</TableCell>
                  <TableCell className="font-medium">{bug.title}</TableCell>
                  <TableCell>{getStatusBadge(bug.status)}</TableCell>
                  <TableCell>{getSeverityBadge(bug.severity)}</TableCell>
                  <TableCell>
                    {bug.assignee ? `${bug.assignee.first_name} ${bug.assignee.last_name}` : "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/bugs/${bug.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
