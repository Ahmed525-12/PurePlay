import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const authHeader = request.headers.get('Authorization')

        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { YTVUrl } = body

        if (!YTVUrl) {
            return NextResponse.json(
                { success: false, error: 'Video URL is required' },
                { status: 400 }
            )
        }

        // Basic YouTube URL validation
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
        if (!ytRegex.test(YTVUrl)) {
            return NextResponse.json(
                { success: false, error: 'Invalid YouTube URL' },
                { status: 400 }
            )
        }

        const response = await fetch('http://pureplay.runasp.net/v1/YTV/AddYTV', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(body),
        })

        let data;
        try {
            data = await response.json()
        } catch (parseError) {
            console.error("Add YTV: Backend returned non-JSON:", response.status, parseError)
            return NextResponse.json(
                { success: false, error: `Backend API Error: ${response.status} (Invalid JSON)` },
                { status: response.status === 200 ? 500 : response.status }
            )
        }

        // Invalidate cache on success
        if (response.ok && data.success) {
            revalidateTag('ytv-list')
            revalidatePath('/home', 'layout')
        }

        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error("Add YTV API Error:", error)
        return NextResponse.json(
            { success: false, error: `Internal server error: ${error.message || error}` },
            { status: 500 }
        )
    }
}
