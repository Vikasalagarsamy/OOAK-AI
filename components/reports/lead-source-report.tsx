"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { format, subDays } from "date-fns"
import { PieChart, BarChart } from "@/components/charts"

interface LeadSourceData {
  name: string
  total: number
  statuses: Record<string, number>
}

interface ApiResponse {
  sources: LeadSourceData[]
  total_leads: number
  date_range: {
    from: string | null
    to: string | null
  }
}

export function LeadSourceReport() {
  const [loading, setLoading] = useState(true)
  const [leadSourceData, setLeadSourceData] = useState<LeadSourceData[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  useEffect(() => {
    async function fetchLeadSourceData() {
      setLoading(true)
      try {
        // Format dates for the API
        const fromDate = format(dateRange.from, "yyyy-MM-dd")
        const toDate = format(dateRange.to, "yyyy-MM-dd")

        // Build the API URL with query parameters
        const params = new URLSearchParams({
          from: fromDate,
          to: toDate,
        })

        const response = await fetch(`/api/reports/lead-sources?${params}`)
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const result: ApiResponse = await response.json()

        setLeadSourceData(result.sources || [])
        setTotalLeads(result.total_leads || 0)
      } catch (error) {
        console.error("Error fetching lead source data:", error)
        setLeadSourceData([])
        setTotalLeads(0)
      } finally {
        setLoading(false)
      }
    }

    fetchLeadSourceData()
  }, [dateRange])

  // Prepare data for charts
  const pieChartData = leadSourceData.map((source) => ({
    name: source.name,
    value: source.total,
  }))

  const barChartData = leadSourceData.map((source) => ({
    name: source.name,
    total: source.total,
    converted: source.statuses?.WON || 0,
    lost: source.statuses?.LOST || 0,
    pending: source.statuses?.PENDING || 0,
    assigned: source.statuses?.ASSIGNED || 0,
    unassigned: source.statuses?.UNASSIGNED || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <DatePickerWithRange 
          date={dateRange} 
          onDateChange={(date) => {
            if (date?.from && date?.to) {
              setDateRange({ from: date.from, to: date.to })
            }
          }} 
        />
        <div className="text-sm text-muted-foreground">
          Total Leads: {totalLeads}
        </div>
      </div>

      <Tabs defaultValue="distribution">
        <TabsList className="mb-4">
          <TabsTrigger value="distribution">Source Distribution</TabsTrigger>
          <TabsTrigger value="conversion">Status Breakdown</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center h-80">
                    <Skeleton className="h-80 w-full" />
                  </div>
                ) : pieChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-80">
                    <p className="text-center text-muted-foreground">
                      No lead data found for the selected date range
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <PieChart data={pieChartData} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center h-80">
                    <Skeleton className="h-80 w-full" />
                  </div>
                ) : barChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-80">
                    <p className="text-center text-muted-foreground">
                      No lead data found for the selected date range
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <BarChart data={barChartData} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : leadSourceData.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-center text-muted-foreground">
                    No lead data found for the selected date range
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status Breakdown by Source</h3>
                  <div className="grid gap-4">
                    {leadSourceData.map((source) => (
                      <div key={source.name} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{source.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            Total: {source.total}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-blue-600">
                              {source.statuses?.UNASSIGNED || 0}
                            </div>
                            <div className="text-muted-foreground">Unassigned</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-600">
                              {source.statuses?.ASSIGNED || 0}
                            </div>
                            <div className="text-muted-foreground">Assigned</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-yellow-600">
                              {source.statuses?.PENDING || 0}
                            </div>
                            <div className="text-muted-foreground">Pending</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600">
                              {source.statuses?.WON || 0}
                            </div>
                            <div className="text-muted-foreground">Won</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-600">
                              {source.statuses?.LOST || 0}
                            </div>
                            <div className="text-muted-foreground">Lost</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : leadSourceData.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-center text-muted-foreground">
                    No lead data found for the selected date range
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{totalLeads}</div>
                      <div className="text-muted-foreground">Total Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {leadSourceData.reduce((sum, source) => sum + (source.statuses?.UNASSIGNED || 0), 0)}
                      </div>
                      <div className="text-muted-foreground">Unassigned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {leadSourceData.reduce((sum, source) => sum + (source.statuses?.WON || 0), 0)}
                      </div>
                      <div className="text-muted-foreground">Won</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {leadSourceData.reduce((sum, source) => sum + (source.statuses?.LOST || 0), 0)}
                      </div>
                      <div className="text-muted-foreground">Lost</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Lead Sources Performance</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Source</th>
                            <th className="text-center p-2">Total</th>
                            <th className="text-center p-2">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadSourceData
                            .sort((a, b) => b.total - a.total)
                            .map((source) => (
                              <tr key={source.name} className="border-b">
                                <td className="p-2 font-medium">{source.name}</td>
                                <td className="text-center p-2">{source.total}</td>
                                <td className="text-center p-2">
                                  {((source.total / totalLeads) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
