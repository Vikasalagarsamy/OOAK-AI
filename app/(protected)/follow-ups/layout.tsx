import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Follow-ups | Lead Management",
  description: "Manage and track follow-ups with leads",
}

interface FollowUpsLayoutProps {
  children: React.ReactNode
}

export default function FollowUpsLayout({ children }: FollowUpsLayoutProps) {
  return (
    <div>
      <div className="bg-muted py-4">
        <div className="container">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
            <Link href="/follow-ups" className="text-foreground font-medium">
              Follow-ups
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
