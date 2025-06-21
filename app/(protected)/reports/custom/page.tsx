import type { Metadata } from "next"
import { CustomReportsGenerator } from "@/components/reports/custom-reports-generator"

export const metadata: Metadata = {
  title: "Custom Reports",
  description: "Create and save custom report configurations",
}

export default function CustomReportsPage() {
  return <CustomReportsGenerator />
}
