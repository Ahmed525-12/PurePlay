'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertCircle, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Types
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

// YouTube API Types
// YouTube API Types (Local definition)
interface SafeYTPlayer {
    playVideo: () => void
    pauseVideo: () => void
    seekTo: (seconds: number, allowSeekAhead: boolean) => void
    getDuration: () => number
    getCurrentTime: () => number
    setVolume: (volume: number) => void
    getVolume: () => number
    mute: () => void
    unMute: () => void
    isMuted: () => boolean
    destroy: () => void
    getPlayerState: () => number
}

interface SafeYTPlayerEvent {
    data: number
    target: SafeYTPlayer
}

interface SafeVideoPlayerProps {
    videoId: string
    className?: string
}

export default function SafeVideoPlayer({ videoId, className }: SafeVideoPlayerProps) {
    const router = useRouter()
    const [video, setVideo] = useState<ApiVideo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Player State
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isMuted, setIsMuted] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [hasEnded, setHasEnded] = useState(false)

    const playerRef = useRef<SafeYTPlayer | null>(null)
    const progressInterval = useRef<NodeJS.Timeout | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 1. Fetch Video Data
    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true)
                setError(null)
                const token = localStorage.getItem('authToken')

                const response = await fetch(`/api/ytv/getbyid?id=${videoId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (!response.ok) throw new Error(`API request failed: ${response.status}`)

                const data: ApiResponse = await response.json()
                if (!data.success || !data.value || data.value.length === 0) {
                    throw new Error(data.error || 'Video not found')
                }

                setVideo(data.value[0])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load video')
            } finally {
                setLoading(false)
            }
        }

        if (videoId) fetchVideo()
    }, [videoId])

    // 2. Initialize YouTube Player
    useEffect(() => {
        if (!video) return

        // Extract actual YouTube ID from URL
        const ytId = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
        if (!ytId) {
            setError("Invalid YouTube URL")
            return
        }

        const initPlayer = () => {
            if (!document.getElementById('safe-youtube-player')) return

            // Use 'any' to avoid global type conflicts
            const YT = (window as any).YT

            playerRef.current = new YT.Player('safe-youtube-player', {
                videoId: ytId,
                host: 'https://www.youtube-nocookie.com', // Force no-cookie domain
                playerVars: {
                    autoplay: 1,      // Autoplay allowed internally
                    controls: 0,      // NO YouTube Controls
                    disablekb: 1,     // NO Keyboard controls
                    fs: 0,            // NO Native Fullscreen button
                    modestbranding: 1,// Hide logo (as much as possible)
                    rel: 0,           // Minimize related videos (not perfect, but overlay fixes this)
                    iv_load_policy: 3,// Hide annotations
                    playsinline: 1,   // Play inline on mobile
                },
                events: {
                    onReady: (event: any) => {
                        setDuration(event.target.getDuration())
                        // setIsPlaying(true) // DO NOT force state here. Let onStateChange handle it.
                        startProgressTracking()
                    },
                    onStateChange: (event: SafeYTPlayerEvent) => {
                        if (event.data === YT.PlayerState.PAUSED) setIsPlaying(false)
                        if (event.data === YT.PlayerState.PLAYING) setIsPlaying(true)
                        if (event.data === YT.PlayerState.ENDED) {
                            setIsPlaying(false)
                            setHasEnded(true)
                            stopProgressTracking()
                        }
                    },
                },
            })
        }

        // Load API
        if (!(window as any).YT) {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
                ; (window as any).onYouTubeIframeAPIReady = initPlayer
        } else {
            initPlayer()
        }

        return () => {
            if (playerRef.current) {
                try { playerRef.current.destroy() } catch (e) { }
            }
            stopProgressTracking()
        }
    }, [video])

    // Progress Tracking
    const startProgressTracking = () => {
        if (progressInterval.current) clearInterval(progressInterval.current)
        progressInterval.current = setInterval(() => {
            if (playerRef.current) {
                setCurrentTime(playerRef.current.getCurrentTime())
            }
        }, 1000)
    }

    const stopProgressTracking = () => {
        if (progressInterval.current) clearInterval(progressInterval.current)
    }

    // Controls Handlers
    const togglePlay = () => {
        if (!playerRef.current) return
        if (hasEnded) {
            replay()
            return
        }

        const playerState = playerRef.current.getPlayerState()
        // 1 = PLAYING, 3 = BUFFERING
        if (playerState === 1 || playerState === 3) {
            playerRef.current.pauseVideo()
        } else {
            playerRef.current.playVideo()
        }
    }

    const replay = () => {
        if (!playerRef.current) return
        playerRef.current.seekTo(0, true)
        playerRef.current.playVideo()
        setHasEnded(false)
        setIsPlaying(true)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value)
        setCurrentTime(time)
        playerRef.current?.seekTo(time, true)
    }

    const toggleMute = () => {
        if (!playerRef.current) return
        if (isMuted) {
            playerRef.current.unMute()
            setIsMuted(false)
        } else {
            playerRef.current.mute()
            setIsMuted(true)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Handle Mouse Move for Controls Visibility
    const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false)
            }, 3000)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center aspect-video bg-black rounded-xl border border-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
        </div>
    )

    if (error || !video) return (
        <div className="flex flex-col items-center justify-center aspect-video bg-gray-900 rounded-xl border border-gray-800 text-white p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Check Connection</h3>
            <p className="text-gray-400 text-center">{error || "Video could not be loaded"}</p>
            <Button variant="outline" className="mt-6 text-black border-white hover:bg-gray-200" onClick={() => router.push('/home')}>
                Return Home
            </Button>
        </div>
    )

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* Video Container - The Fortress */}
            <div
                ref={containerRef}
                className="relative w-full aspect-video bg-black rounded-none sm:rounded-xl overflow-hidden group shadow-2xl ring-1 ring-white/10"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowControls(false)}
            >
                {/* The YouTube Iframe */}
                <div id="safe-youtube-player" className="w-full h-full pointer-events-none" />

                {/* CLICK BLOCKER OVERLAY - Absolute Protection */}
                {/* This transparent div sits on top of the iframe and captures ALL clicks */}
                {/* This prevents: Context Menu, Title Click, Channel Click, Related Video Click */}
                <div
                    className="absolute inset-0 z-10 bg-transparent"
                    onClick={togglePlay} // Clicking video toggles play/pause
                    onContextMenu={(e) => e.preventDefault()} // Block right click
                />

                {/* Replay Overlay (End Screen) */}
                {hasEnded && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="text-center">
                            <h3 className="text-white text-2xl font-bold mb-6">Finished!</h3>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={replay}
                                    className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Watch Again
                                </button>
                                <button
                                    onClick={() => router.push('/home')}
                                    className="flex items-center gap-2 px-8 py-3 bg-gray-800 text-white border border-gray-700 rounded-full font-bold hover:bg-gray-700 transition-colors"
                                >
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Controls Bar */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300",
                        showControls || !isPlaying ? "opacity-100" : "opacity-0"
                    )}
                >
                    {/* Progress Bar */}
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 mb-4 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500 hover:h-2 transition-all"
                        onClick={(e) => e.stopPropagation()} // Allow seeking
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Play/Pause */}
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay() }}
                                className="text-white hover:text-red-400 transition-colors"
                            >
                                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                            </button>

                            {/* Volume */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleMute() }}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>

                            <div className="text-white/80 text-sm font-medium font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>

                            {/* Fullscreen */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                                className="text-white/80 hover:text-white transition-colors ml-2"
                            >
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
