import { UltraFastDashboard } from "@/components/ultra-fast-dashboard"

/**
 * ⚡ EMERGENCY SIMPLE DASHBOARD PAGE
 * 
 * Simplified for guaranteed instant loading
 * No complex dependencies or server-side blocking
 */

export default function DashboardPage() {
  return <UltraFastDashboard />
}

export const metadata = {
  title: "Dashboard | Wedding Photography CRM",
  description: "Ultra-fast dashboard for wedding photography business management"
}

// 🚀 OPTIMIZATION: Enable static optimization for faster cold starts
export const dynamic = 'force-dynamic' // Ensures fresh data but optimized rendering
export const revalidate = 60 // Cache static parts for 60 seconds
