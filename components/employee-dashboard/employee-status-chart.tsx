"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface EmployeeStatusChartProps {
  data: { status: string; count: number }[]
}

const COLORS = ["#4ade80", "#94a3b8", "#fbbf24", "#f87171"]
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  terminated: "Terminated",
}

export function EmployeeStatusChart({ data }: EmployeeStatusChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
  }))

  // If no data, show a message
  if (chartData.length === 0) {
    return <div className="flex justify-center items-center h-64">No employee status data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} employees`, "Count"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
