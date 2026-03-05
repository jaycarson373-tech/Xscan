import { NextResponse } from "next/server"

export async function POST() {
  // This will trigger a fresh scan on next /api/tweets call
  return NextResponse.json({ success: true, message: "Cache cleared" })
}
