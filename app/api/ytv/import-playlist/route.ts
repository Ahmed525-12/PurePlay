import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { playlistUrl } = body
        const authHeader = request.headers.get('Authorization')

        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!playlistUrl) {
            return NextResponse.json(
                { success: false, error: 'Playlist URL is required' },
                { status: 400 }
            )
        }

        // Extract Playlist ID
        let playlistId = ''
        try {
            const url = new URL(playlistUrl)
            playlistId = url.searchParams.get('list') || ''
        } catch (e) {
            // Try to handle if user pasted just the ID
            playlistId = playlistUrl
        }

        if (!playlistId) {
            return NextResponse.json(
                { success: false, error: 'Invalid Playlist URL' },
                { status: 400 }
            )
        }

        const apiKey = process.env.YOUTUBE_API_KEY
        if (!apiKey) {
            console.error("Missing YOUTUBE_API_KEY environment variable")
            return NextResponse.json(
                { success: false, error: 'Server configuration error: Missing YouTube API Key' },
                { status: 500 }
            )
        }

        // Fetch videos from YouTube
        const ytResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`)

        if (!ytResponse.ok) {
            const errorText = await ytResponse.text()
            console.error(`YouTube API Error: ${ytResponse.status} - ${errorText}`)
            return NextResponse.json(
                { success: false, error: `YouTube API Error: ${ytResponse.statusText}` },
                { status: ytResponse.status }
            )
        }

        const ytData = await ytResponse.json()
        const items = ytData.items || []

        if (items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No videos found in this playlist' },
                { status: 404 }
            )
        }

        let successCount = 0
        let failCount = 0

        // Loop and insert
        for (const item of items) {
            const snippet = item.snippet
            if (!snippet) continue

            const videoId = snippet.resourceId?.videoId
            if (!videoId) continue

            // Private video check
            if (snippet.title === 'Private video' || snippet.title === 'Deleted video') {
                continue;
            }

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

            console.log(`[Import] Processing video: ${videoId} - ${snippet.title}`)

            try {
                const addResponse = await fetch('http://pureplay.runasp.net/v1/YTV/AddYTV', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    },
                    body: JSON.stringify({
                        YTVUrl: videoUrl
                    }),
                })

                if (addResponse.ok) {
                    const addData = await addResponse.json()
                    if (addData.success) {
                        successCount++
                    } else {
                        console.error(`[Import] Failed to add ${videoId}: ${addData.error}`)
                        failCount++
                    }
                } else {
                    console.error(`[Import] HTTP Error adding ${videoId}: ${addResponse.status}`)
                    failCount++
                }
            } catch (err) {
                console.error(`[Import] Exception adding ${videoId}:`, err)
                failCount++
            }
        }

        // Invalidate cache
        revalidateTag('ytv-list')
        revalidatePath('/home', 'layout')

        const message = `Imported ${successCount} videos. Failed: ${failCount}`
        console.log(`[Import] Completed. ${message}`)

        return NextResponse.json({
            success: true,
            message: message,
            added: successCount,
            failed: failCount
        })

    } catch (error) {
        console.error("Import API Critical Error:", error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
