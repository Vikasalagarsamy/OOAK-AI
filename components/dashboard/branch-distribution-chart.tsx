"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface BranchDistributionChartProps {
  data: Array<{ company: string; count: number }>
}

export function BranchDistributionChart({ data }: BranchDistributionChartProps) {
  // Use state to handle the data
  const [chartData, setChartData] = useState<Array<{ company: string; count: number }>>(data || [])

  // Update chart data when props change
  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data)
    }
  }, [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
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
  )
}
