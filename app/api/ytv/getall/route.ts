import { NextResponse } from 'next/server'
import { fetchYTVList } from '@/lib/ytv-api'

export async function GET(request: Request) {
  try {
    const incomingAuth = request.headers.get("authorization") ?? ""

    // Use the cached fetch helper
    const response = await fetchYTVList(incomingAuth)

    let data;
    try {
      data = await response.json()
    } catch (parseError) {
      console.error("Backend returned non-JSON:", response.status, parseError)
      return NextResponse.json(
        { success: false, error: `Backend API Error: ${response.status} (Invalid JSON)` },
        { status: response.status === 200 ? 500 : response.status }
      )
    }

    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error }, { status: response.status })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Get All YTV API Error:", error)
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}