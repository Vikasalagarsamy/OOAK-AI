"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the diagnostic component with no SSR
const DiagnosticComponent = dynamic(
  () => import("@/components/follow-ups/followup-diagnostic").then((mod) => mod.FollowupDiagnostic),
  { ssr: false, loading: () => <p className="text-center py-4">Loading diagnostic tool...</p> },
)

export default function DiagnosticClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <p className="text-center py-4">Loading diagnostic tool...</p>
  }

  return <DiagnosticComponent />
}
