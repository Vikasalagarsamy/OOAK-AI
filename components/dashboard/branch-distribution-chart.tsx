"\"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BranchDistributionChartProps {
  data: Array<{ company: string; count: number }>
}

export function BranchDistributionChart({ data }: BranchDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
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
