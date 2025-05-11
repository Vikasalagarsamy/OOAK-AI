"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"

export default function LeadDataDebugger({ leadId }: { leadId: string }) {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch lead data
      const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

      if (leadError) {
        throw new Error(`Error fetching lead: ${leadError.message}`)
      }

      // Fetch employee data if assigned
      let employeeData = null
      if (lead.assigned_to) {
        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", lead.assigned_to)
          .single()

        if (!employeeError) {
          employeeData = employee
        } else {
          console.error("Error fetching employee:", employeeError)
        }
      }

      setDebugData({
        lead,
        employee: employeeData,
      })
    } catch (err: any) {
      console.error("Debug error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Lead Data Debugger</span>
          <Button size="sm" variant="outline" onClick={fetchDebugData} disabled={loading}>
            {loading ? "Loading..." : "Debug Lead Data"}
          </Button>
        </CardTitle>
      </CardHeader>
      {debugData && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Lead Data:</h3>
              <pre className="bg-slate-100 p-3 rounded-md overflow-auto text-xs">
                {JSON.stringify(debugData.lead, null, 2)}
              </pre>
            </div>

            {debugData.employee && (
              <div>
                <h3 className="font-medium mb-2">Assigned Employee:</h3>
                <pre className="bg-slate-100 p-3 rounded-md overflow-auto text-xs">
                  {JSON.stringify(debugData.employee, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {error && (
        <CardContent>
          <div className="bg-red-50 text-red-800 p-3 rounded-md">{error}</div>
        </CardContent>
      )}
    </Card>
  )
}
