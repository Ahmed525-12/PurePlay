'use client'

import { useEffect, useState } from 'react'
import { VideoPlayer, VideoPlayerContent, VideoPlayerControlBar, VideoPlayerPlayButton, VideoPlayerSeekBackwardButton, VideoPlayerSeekForwardButton, VideoPlayerTimeRange, VideoPlayerTimeDisplay, VideoPlayerMuteButton, VideoPlayerVolumeRange } from '@/components/ui/shadcn-io/video-player'
import YouTubeNoBranding from './YouTubeNoBranding'


type ApiVideo = {
  id: number
  accountUserId: string
  video_url: string
  title: string
  author_Name: string
  thumbnail_url: string
  accountUser: unknown | null
}

type ApiResponse = {
  success: boolean
  value: ApiVideo[]
  error: string | null
}

interface VideoPlayerWithAPIProps {
  videoId: string
  className?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
}

export default function VideoPlayerWithAPI({
  videoId,
  className = '',
  autoplay = false,
  muted = false,
  loop = false
}: VideoPlayerWithAPIProps) {
  const [video, setVideo] = useState<ApiVideo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('authToken')

        const response = await fetch(`/api/ytv/getbyid?id=${videoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        // Log the response for debugging
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)

        // Check if response is ok
        if (!response.ok) {
          const text = await response.text()
          console.error('Response text:', text)
          throw new Error(`API request failed: ${response.status}`)
        }

        // Check content type
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          throw new Error('Server returned non-JSON response')
        }

        const data: ApiResponse = await response.json()


        if (!data.success || !data.value || data.value.length === 0) {
          throw new Error(data.error || 'Video not found')
        }

        setVideo(data.value[0])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load video'
        setError(errorMessage)
        console.error('Video fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [videoId])

  if (loading) {
    return (
      <div className={`flex items-center justify-center aspect-video bg-gray-100 rounded-lg border ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className={`flex items-center justify-center aspect-video bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">Failed to load video</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const isYouTube = video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')

  if (isYouTube) {
    const videoIdMatch = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]

    if (!videoIdMatch) {
      return (
        <div className="text-red-600">Invalid YouTube URL</div>
      )
    }

    return (
      <YouTubeNoBranding
        videoId={videoIdMatch}
        title={video.title}
        author={video.author_Name}
        autoplay={autoplay}
        className={className}
      />
    )
  }

  return (
    <div className={className}>
      <VideoPlayer className="overflow-hidden rounded-lg border">
        <VideoPlayerContent
          crossOrigin=""
          muted={muted}
          preload="auto"
          slot="media"
          src={video.video_url}
          autoPlay={autoplay}
          loop={loop}
          poster={video.thumbnail_url}
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerSeekBackwardButton />
          <VideoPlayerSeekForwardButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-gray-900">{video.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{video.author_Name}</p>
      </div>
    </div>
  )
}