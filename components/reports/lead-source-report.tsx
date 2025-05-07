"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { format, subDays } from "date-fns"
import { PieChart, BarChart } from "@/components/charts"

export function LeadSourceReport() {
  const [loading, setLoading] = useState(true)
  const [leadSourceData, setLeadSourceData] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchLeadSourceData() {
      setLoading(true)
      try {
        // Format dates for the query
        const fromDate = format(dateRange.from, "yyyy-MM-dd")
        const toDate = format(dateRange.to, "yyyy-MM-dd")

        // Fetch lead counts by source
        const { data, error } = await supabase
          .from("leads")
          .select(`
            lead_source_id,
            lead_sources(name),
            status
          `)
          .gte("created_at", fromDate)
          .lte("created_at", toDate)

        if (error) throw error

        // Process the data for visualization
        const sourceMap = new Map()

        data?.forEach((lead) => {
          const sourceName = lead.lead_sources?.name || "Unknown"
          const sourceId = lead.lead_source_id || 0

          if (!sourceMap.has(sourceId)) {
            sourceMap.set(sourceId, {
              id: sourceId,
              name: sourceName,
              total: 0,
              statuses: {},
            })
          }

          const sourceData = sourceMap.get(sourceId)
          sourceData.total += 1

          if (!sourceData.statuses[lead.status]) {
            sourceData.statuses[lead.status] = 0
          }
          sourceData.statuses[lead.status] += 1
        })

        setLeadSourceData(Array.from(sourceMap.values()))
      } catch (error) {
        console.error("Error fetching lead source data:", error)
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
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
      </div>

      <Tabs defaultValue="distribution">
        <TabsList className="mb-4">
          <TabsTrigger value="distribution">Source Distribution</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center h-80">
                    <Skeleton className="h-80 w-full" />
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
              ) : (
                <div className="h-80">
                  {/* Conversion rate chart would go here */}
                  <p className="text-center text-muted-foreground">
                    Conversion rate analysis will be implemented in the next phase
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : (
                <div className="h-80">
                  {/* Trend chart would go here */}
                  <p className="text-center text-muted-foreground">
                    Trend analysis will be implemented in the next phase
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
