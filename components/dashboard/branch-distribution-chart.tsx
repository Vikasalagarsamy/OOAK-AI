"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface BranchDistributionChartProps {
  data?: Array<{ company: string; count: number }>
}

export default function BranchDistributionChart({ data = [] }: BranchDistributionChartProps) {
  // Use state to handle the data
  const [chartData, setChartData] = useState<Array<{ company: string; count: number }>>(data || [])

  // Update chart data when props change
  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data)
    } else {
      // Fallback data if none is provided
      setChartData([
        { company: "Acme Corp", count: 5 },
        { company: "TechCorp", count: 3 },
        { company: "Global Industries", count: 7 },
        { company: "Startup Inc", count: 1 },
        { company: "Enterprise Ltd", count: 4 },
      ])
    }
  }, [data])

  return (
    <div className="w-full h-full bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Branches by Company</h3>
      <p className="text-sm text-gray-500 mb-4">Distribution of branches across companies</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="company" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
