"use client"

import { CheckCircle, Calendar, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FollowUpBulkActionsProps {
  selectedCount: number
  onAction: (action: string) => void
  onClearSelection: () => void
}

export function FollowUpBulkActions({ selectedCount, onAction, onClearSelection }: FollowUpBulkActionsProps) {
  return (
    <div className="bg-muted p-3 rounded-md flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{selectedCount} items selected</span>
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8">
          <X className="h-4 w-4 mr-1" />
          Clear selection
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onAction("complete")} className="h-8">
          <CheckCircle className="h-4 w-4 mr-1" />
          Mark as Completed
        </Button>

        <Button variant="outline" size="sm" onClick={() => onAction("reschedule")} className="h-8">
          <Calendar className="h-4 w-4 mr-1" />
          Reschedule
        </Button>

        <Button variant="destructive" size="sm" onClick={() => onAction("delete")} className="h-8">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}
