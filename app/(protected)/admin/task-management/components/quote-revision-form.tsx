"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowUpCircle } from 'lucide-react'

interface QuoteRevisionFormProps {
  quotationId: string
  currentAmount: number
  rejectionRemarks: string
  onSubmitRevision: (revisionData: {
    newAmount: number
    revisionNotes: string
  }) => void
}

export default function QuoteRevisionForm({
  quotationId,
  currentAmount,
  rejectionRemarks,
  onSubmitRevision
}: QuoteRevisionFormProps) {
  const [newAmount, setNewAmount] = useState(currentAmount)
  const [revisionNotes, setRevisionNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitRevision({
      newAmount,
      revisionNotes
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rejection Alert */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Quote Rejected</AlertTitle>
        <AlertDescription className="mt-2 font-medium">
          {rejectionRemarks}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Quote Revision - #{quotationId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Current Amount: ₹{currentAmount.toLocaleString()}
            </label>
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                placeholder="Enter new amount"
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                {newAmount > currentAmount ? '↑' : '↓'} 
                {Math.abs(((newAmount - currentAmount) / currentAmount) * 100).toFixed(1)}% change
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Revision Notes
            </label>
            <Textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Explain the changes made in this revision..."
              rows={4}
            />
          </div>

          <Button 
            type="submit"
            className="w-full"
            disabled={!revisionNotes.trim() || newAmount <= 0}
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Submit Revision for Approval
          </Button>
        </CardContent>
      </Card>
    </form>
  )
} 