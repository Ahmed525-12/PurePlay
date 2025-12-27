import { NextResponse } from 'next/server'
import { fetchYTVList } from '@/lib/ytv-api'

export async function GET(request: Request) {
  try {
    const incomingAuth = request.headers.get("authorization") ?? ""

    // Use the cached fetch helper
    const response = await fetchYTVList(incomingAuth)

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error }, { status: response.status })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Internal server error ${error}` },
      { status: 500 }
    )
  }
}