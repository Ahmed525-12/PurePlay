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

        // Fetch playlist page (Scraping method - No API Key needed)
        // We act like a browser to get the HTML which contains the video IDs
        const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: `Failed to fetch playlist page: ${response.status}` },
                { status: response.status }
            )
        }

        const html = await response.text()

        // Extract Video IDs using Regex
        // Look for pattern "videoId":"VIDEO_ID"
        const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g
        const matches = [...html.matchAll(regex)]

        if (matches.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No videos found in this playlist (or playlist is private)' },
                { status: 404 }
            )
        }

        // Deduplicate IDs
        const videoIds = new Set<string>()
        for (const match of matches) {
            videoIds.add(match[1])
        }

        console.log(`[Import] Found ${videoIds.size} unique videos in scraped playlist`)

        let successCount = 0
        let failCount = 0

        // Loop and insert
        for (const videoId of videoIds) {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

            console.log(`[Import] Processing video: ${videoId}`)

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
                        // console.error(`[Import] Failed to add ${videoId}: ${addData.error}`)
                        failCount++
                    }
                } else {
                    // console.error(`[Import] HTTP Error adding ${videoId}: ${addResponse.status}`)
                    failCount++
                }
            } catch (err) {
                console.error(`[Import] Exception adding ${videoId}:`, err)
                failCount++
            }
        }

        // Invalidate cache
        // revalidateTag('ytv-list') // Disabled due to build error
        revalidatePath('/home', 'layout')

        const message = `Imported ${successCount} videos. Failed: ${failCount}`
        console.log(`[Import] Completed. ${message}`)

        return NextResponse.json({
            success: true,
            message: message,
            added: successCount,
            failed: failCount
        })

    } catch (error: any) {
        console.error("Import API Critical Error:", error)
        return NextResponse.json(
            { success: false, error: `Internal server error: ${error.message || error}` },
            { status: 500 }
        )
    }
}
