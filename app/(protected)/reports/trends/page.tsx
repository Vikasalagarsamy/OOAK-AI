import type { Metadata } from "next"
import { TrendAnalysisReport } from "@/components/reports/trend-analysis-report"

export const metadata: Metadata = {
  title: "Trend Analysis",
  description: "Analyze lead and conversion trends over time",
}

export default function TrendsPage() {
  return <TrendAnalysisReport />
}
