import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      count: 0
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to get notification count"
    }, { status: 500 })
  }
}
