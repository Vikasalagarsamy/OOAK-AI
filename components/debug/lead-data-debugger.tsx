"use client"

import { useState } from "react"
import { getLeadDetails } from "@/actions/lead-actions"
import { getEmployee } from "@/actions/employee-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bug, Database, RefreshCw, AlertCircle } from "lucide-react"

export default function LeadDataDebugger({ leadId }: { leadId: string }) {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useCurrentUser()

  const fetchDebugData = async () => {
    if (!user) {
      setError("Authentication required for debugging")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`🐛 Debugging lead data for ID: ${leadId}`)

      // Fetch lead data using PostgreSQL server action
      const leadResult = await getLeadDetails(parseInt(leadId))

      if (!leadResult.success || !leadResult.data) {
        throw new Error(leadResult.error || 'Failed to fetch lead data')
      }

      const lead = leadResult.data
      console.log(`✅ Retrieved lead: ${lead.contact_name}`)

      // Fetch employee data if assigned
      let employeeData = null
      if (lead.assigned_to) {
        console.log(`👤 Fetching assigned employee: ${lead.assigned_to}`)
        
        const employeeResult = await getEmployee(lead.assigned_to)
        
        if (employeeResult.success && employeeResult.data) {
          employeeData = employeeResult.data
          console.log(`✅ Retrieved employee: ${employeeData.name}`)
        } else {
          console.warn(`⚠️ Could not fetch employee: ${employeeResult.error}`)
          // Don't throw error, just log warning
        }
      }

      setDebugData({
        lead: {
          ...lead,
          _debug_info: {
            fetched_at: new Date().toISOString(),
            user_id: user.id,
            data_source: 'PostgreSQL'
          }
        },
        employee: employeeData ? {
          ...employeeData,
          _debug_info: {
            fetched_at: new Date().toISOString(),
            data_source: 'PostgreSQL'
          }
        } : null,
        debug_session: {
          timestamp: new Date().toISOString(),
          user: user.name,
          lead_id: leadId,
          database: 'PostgreSQL',
          version: '1.0'
        }
      })

      console.log('✅ Debug data compiled successfully')

    } catch (err: any) {
      console.error("❌ Debug error:", err)
      setError(err.message || "An error occurred during debugging")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Lead Data Debugger
            <span className="text-sm font-normal text-muted-foreground">
              (PostgreSQL)
            </span>
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchDebugData} 
            disabled={loading || !user}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Debug Lead Data
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {!user && (
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication required to access debug features.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {debugData && (
        <CardContent>
          <div className="space-y-4">
            {/* Debug Session Info */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Debug Session:
              </h3>
              <pre className="bg-green-50 border border-green-200 p-3 rounded-md overflow-auto text-xs font-mono">
                {JSON.stringify(debugData.debug_session, null, 2)}
              </pre>
            </div>

            {/* Lead Data */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Lead Data:
              </h3>
              <pre className="bg-blue-50 border border-blue-200 p-3 rounded-md overflow-auto text-xs font-mono">
                {JSON.stringify(debugData.lead, null, 2)}
              </pre>
            </div>

            {/* Employee Data */}
            {debugData.employee && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  👤 Assigned Employee:
                </h3>
                <pre className="bg-purple-50 border border-purple-200 p-3 rounded-md overflow-auto text-xs font-mono">
                  {JSON.stringify(debugData.employee, null, 2)}
                </pre>
              </div>
            )}

            {/* No Employee Assigned */}
            {!debugData.employee && debugData.lead.assigned_to && (
              <div>
                <h3 className="font-medium mb-2 text-orange-600">⚠️ Employee Assignment Issue:</h3>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Lead is assigned to employee ID {debugData.lead.assigned_to}, but employee data could not be retrieved.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {!debugData.lead.assigned_to && (
              <div>
                <Alert>
                  <AlertDescription>
                    ℹ️ This lead is not assigned to any employee.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {error && (
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  )
}
