import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, PieChart, Settings, TrendingUp, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Reports Dashboard",
  description: "Analytics and reporting overview",
}

const reportCards = [
  {
    title: "Lead Source Analysis",
    description: "Analyze performance of different lead sources",
    icon: <PieChart className="h-8 w-8 text-primary" />,
    href: "/reports/lead-sources",
  },
  {
    title: "Conversion Funnel",
    description: "Track lead progression through sales stages",
    icon: <GitBranch className="h-8 w-8 text-primary" />,
    href: "/reports/conversion-funnel",
  },
  {
    title: "Team Performance",
    description: "Compare sales team performance metrics",
    icon: <Users className="h-8 w-8 text-primary" />,
    href: "/reports/team-performance",
  },
  {
    title: "Trend Analysis",
    description: "Analyze lead and conversion trends over time",
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    href: "/reports/trends",
  },
  {
    title: "Custom Reports",
    description: "Create and save custom report configurations",
    icon: <Settings className="h-8 w-8 text-primary" />,
    href: "/reports/custom",
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((card, index) => (
          <Link key={index} href={card.href} className="block">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
