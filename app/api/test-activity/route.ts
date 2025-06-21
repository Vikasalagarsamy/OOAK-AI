import { createClient } from '@/lib/postgresql-client'
import { createTestActivity } from "@/utils/test-activity"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await createTestActivity()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating test activity:", error)
    return NextResponse.json({ error: "Failed to create test activity" }, { status: 500 })
  }
}
