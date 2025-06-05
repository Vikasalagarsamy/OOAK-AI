import { getCurrentUser } from "@/actions/auth-actions"
import { PersonalizedHeader } from "@/components/dashboard/personalized-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RealTimeDashboard } from "@/components/dashboard/real-time-dashboard"
import { AIBusinessIntelligence } from "@/components/ai/ai-business-intelligence"
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  GitBranch,
  UserCheck
} from "lucide-react"

// Add this export to make the page dynamic since it uses cookies
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  // If user is Admin, show AI Business Intelligence Dashboard
  if (user?.isAdmin) {
    return (
      <div className="space-y-6">
        <PersonalizedHeader />
        <AIBusinessIntelligence user={user} />
      </div>
    )
  }

  // Regular dashboard for non-admin users
  return (
    <div className="space-y-6">
      <PersonalizedHeader />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Companies"
          value={6}
          icon={<Building2 className="h-4 w-4 text-blue-600" />}
          trend={{ isPositive: false, value: 100 }}
        />
        <StatsCard
          title="Total Branches"
          value={6}
          icon={<GitBranch className="h-4 w-4 text-red-600" />}
          trend={{ isPositive: false, value: 100 }}
        />
        <StatsCard
          title="Total Employees"
          value={2}
          icon={<Users className="h-4 w-4 text-orange-600" />}
          trend={{ isPositive: false, value: 100 }}
        />
        <StatsCard
          title="Total Clients"
          value={8}
          icon={<UserCheck className="h-4 w-4 text-green-600" />}
          trend={{ isPositive: true, value: 100 }}
        />
      </div>

      <RealTimeDashboard />
    </div>
  )
}
