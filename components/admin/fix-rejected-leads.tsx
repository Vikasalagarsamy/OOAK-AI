"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fixRejectedLeads, fixSpecificRejectedLead } from "@/actions/fix-rejected-leads"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function FixRejectedLeads() {
  const [isFixingAll, setIsFixingAll] = useState(false)
  const [isFixingSpecific, setIsFixingSpecific] = useState(false)
  const [leadId, setLeadId] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean | null>(null)
  const { toast } = useToast()

  const handleFixAll = async () => {
    setIsFixingAll(true)
    setResult(null)
    setSuccess(null)

    try {
      const response = await fixRejectedLeads()
      setSuccess(response.success)
      setResult(response.message)

      toast({
        title: response.success ? "Success" : "Error",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error fixing rejected leads:", error)
      setSuccess(false)
      setResult(`An unexpected error occurred: ${error}`)

      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsFixingAll(false)
    }
  }

  const handleFixSpecific = async () => {
    if (!leadId || isNaN(Number.parseInt(leadId))) {
      toast({
        title: "Invalid Lead ID",
        description: "Please enter a valid lead ID",
        variant: "destructive",
      })
      return
    }

    setIsFixingSpecific(true)
    setResult(null)
    setSuccess(null)

    try {
      const response = await fixSpecificRejectedLead(Number.parseInt(leadId))
      setSuccess(response.success)
      setResult(response.message)

      toast({
        title: response.success ? "Success" : "Error",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error fixing specific rejected lead:", error)
      setSuccess(false)
      setResult(`An unexpected error occurred: ${error}`)

      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsFixingSpecific(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Fix Rejected Leads</CardTitle>
        <CardDescription>Fix rejected leads with missing rejection details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Fix All Rejected Leads</h3>
            <p className="text-sm text-gray-500">
              This will fix all rejected leads that have missing rejection details
            </p>
          </div>
          <Button onClick={handleFixAll} disabled={isFixingAll || isFixingSpecific}>
            {isFixingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fix All Rejected Leads
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Fix Specific Rejected Lead</h3>
            <p className="text-sm text-gray-500">Enter the ID of a specific rejected lead to fix</p>
          </div>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="leadId">Lead ID</Label>
              <Input
                type="number"
                id="leadId"
                placeholder="Enter lead ID"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                disabled={isFixingAll || isFixingSpecific}
              />
            </div>
            <Button onClick={handleFixSpecific} disabled={isFixingAll || isFixingSpecific || !leadId}>
              {isFixingSpecific && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fix Lead
            </Button>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-md ${success ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${success ? "text-green-800" : "text-red-800"}`}>
                  {success ? "Success" : "Error"}
                </h3>
                <div className={`mt-2 text-sm ${success ? "text-green-700" : "text-red-700"}`}>
                  <p>{result}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Note: This tool will update rejected leads to ensure all rejection details are properly recorded.
        </p>
      </CardFooter>
    </Card>
  )
}
