"use client"

import { useState, useEffect } from "react"
import { validateDepartmentData, getDepartmentDistribution } from "@/actions/department-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw, Loader2 } from "lucide-react"

export function DepartmentDataDiagnostics() {
  const [validationResult, setValidationResult] = useState<any>(null)
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const result = await validateDepartmentData()
      setValidationResult(result)

      const deptData = await getDepartmentDistribution()
      setDepartmentData(deptData)
    } catch (error) {
      console.error("Error running diagnostics:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const deptData = await getDepartmentDistribution()
      setDepartmentData(deptData)
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Department Data Diagnostics</CardTitle>
          <CardDescription>Analyze and validate department distribution data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Data Validation</h3>
                {validationResult ? (
                  <div className={`p-4 rounded-md ${validationResult.valid ? "bg-green-50" : "bg-red-50"}`}>
                    <div className="flex items-center">
                      {validationResult.valid ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className={validationResult.valid ? "text-green-700" : "text-red-700"}>
                        {validationResult.valid ? "Data validation passed" : validationResult.issues?.[0]}
                      </span>
                    </div>

                    {!validationResult.valid && validationResult.invalidEmployees && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Employees with invalid department references:</h4>
                        <div className="max-h-40 overflow-y-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">ID</th>
                                <th className="text-left py-2">Name</th>
                                <th className="text-left py-2">Department ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validationResult.invalidEmployees.map((emp: any) => (
                                <tr key={emp.id} className="border-b">
                                  <td className="py-2">{emp.id}</td>
                                  <td className="py-2">{`${emp.first_name} ${emp.last_name}`}</td>
                                  <td className="py-2">{emp.department_id}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No validation data available</div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Department Distribution</h3>
                  <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>

                {departmentData.length > 0 ? (
                  <div className="space-y-2">
                    {departmentData.map((dept, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-muted rounded-md">
                        <span>{dept.department}</span>
                        <span className="font-medium">{dept.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No department data available</div>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              "Run Full Diagnostics"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
