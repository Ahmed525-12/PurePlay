'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface YouTubeNoBrandingProps {
  videoId: string
  title: string
  author: string
  autoplay?: boolean
  className?: string
}

interface YTPlayer {
  destroy: () => void
}

interface YTPlayerEvent {
  data: number
}

interface YTPlayerOptions {
  videoId: string
  playerVars: {
    rel: number
    modestbranding: number
    controls: number
    autoplay: number
    iv_load_policy: number
    fs: number
    playsinline: number
    color: string
  }
  events: {
    onStateChange: (event: YTPlayerEvent) => void
  }
}

declare global {
  interface Window {
    YT: {
      Player: new (element: string | HTMLElement, options: YTPlayerOptions) => YTPlayer
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubeNoBranding({
  videoId,
  title,
  author,
  autoplay = false,
  className = ''
}: YouTubeNoBrandingProps) {
  const router = useRouter()
  const [showVideo, setShowVideo] = useState(autoplay)
  const playerRef = useRef<YTPlayer | null>(null)

  useEffect(() => {
    if (!showVideo) return

    const onPlayerStateChange = (event: YTPlayerEvent) => {
      // YT.PlayerState.ENDED = 0
      if (event.data === 0) {
        // Video ended, redirect to home
        setTimeout(() => {
          router.push('/home')
        }, 10) // Small delay for smooth transition
      }
    }

    const initPlayer = () => {
      if (!document.getElementById('youtube-player')) return

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          autoplay: autoplay ? 1 : 0,
          iv_load_policy: 3,
          fs: 1,
          playsinline: 1,
          color: 'white',
        },
        events: {
          onStateChange: onPlayerStateChange,
        },
      })
    }

    // Load YouTube IFrame API
    const loadYouTubeAPI = () => {
      if (typeof window === 'undefined') return

      if (window.YT && window.YT.Player) {
        initPlayer()
        return
      }

      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initPlayer
    }

    loadYouTubeAPI()

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (error) {
          console.error('Error destroying player:', error)
        }
      }
    }
  }, [showVideo, videoId, autoplay, router])

  if (!showVideo) {
    return (
      <div className={className}>
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
          {/* Thumbnail */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to standard quality if maxres not available
              e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            }}
          />
          
          {/* Play button overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all"
            onClick={() => setShowVideo(true)}
          >
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{author}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div id="youtube-player" className="w-full h-full" />
      </div>
      
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{author}</p>
      </div>
    </div>
  )
}