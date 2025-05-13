"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { testReassignmentAction } from "@/actions/test-reassignment-action"
import { AlertCircle, CheckCircle } from "lucide-react"

export function TestLeadReassignment() {
  const [employeeId, setEmployeeId] = useState<string>("")
  const [newStatus, setNewStatus] = useState<string>("inactive")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    if (!employeeId) return

    setIsLoading(true)
    try {
      const response = await testReassignmentAction(Number.parseInt(employeeId), newStatus)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error.message}`,
        details: null,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Test Lead Reassignment</CardTitle>
        <CardDescription>Test the automatic lead reassignment when an employee's status changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder="Enter employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                    {result.success ? "Success" : "Error"}
                  </h3>
                  <div className={`mt-2 text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                    <p>{result.message}</p>
                  </div>
                  {result.details && (
                    <div className="mt-4">
                      <details className="text-sm">
                        <summary className="font-medium cursor-pointer">View Details</summary>
                        <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleTest} disabled={isLoading || !employeeId}>
          {isLoading ? "Testing..." : "Run Test"}
        </Button>
      </CardFooter>
    </Card>
  )
}
