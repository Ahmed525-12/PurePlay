import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const incomingAuth = request.headers.get('authorization') ?? ''
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `http://pureplay.runasp.net/v1/YTV/GetbyIdYTV/${id}`,
      {
        method: 'GET',
        headers: {
          Authorization: incomingAuth,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch video' },
        { status: 400 }
      )
    }

    // Wrap single video object in an array to match expected format
    const normalizedData = {
      ...data,
      value: Array.isArray(data.value) ? data.value : [data.value]
    }

    return NextResponse.json(normalizedData, { status: 200 })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}