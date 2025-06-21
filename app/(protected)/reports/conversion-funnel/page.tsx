import type { Metadata } from "next"
import { ConversionFunnelReport } from "@/components/reports/conversion-funnel-report"

export const metadata: Metadata = {
  title: "Conversion Funnel Analysis",
  description: "Track lead progression through sales stages",
}

export default function ConversionFunnelPage() {
  return <ConversionFunnelReport />
}
