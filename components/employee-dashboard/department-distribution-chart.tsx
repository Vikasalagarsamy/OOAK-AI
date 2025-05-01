"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DepartmentDistributionChartProps {
  data: { name: string; count: number }[]
}

export function DepartmentDistributionChart({ data }: DepartmentDistributionChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    name: item.name || "No Department",
    count: item.count,
  }))

  // If no data, show a message
  if (chartData.length === 0) {
    return <div className="flex justify-center items-center h-64">No department data available</div>
  }

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
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} employees`, "Count"]} />
        <Bar dataKey="count" fill="#3b82f6" name="Employees" />
      </BarChart>
    </ResponsiveContainer>
  )
}
