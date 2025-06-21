import type { Metadata } from "next"
import { TeamPerformanceReport } from "@/components/reports/team-performance-report"

export const metadata: Metadata = {
  title: "Team Performance Analysis",
  description: "Compare sales team performance metrics",
}

export default function TeamPerformancePage() {
  return <TeamPerformanceReport />
}
