"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// --- Types ---
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

type Video = {
  id: number
  title: string
  thumbnail: string
  channel: string
  videoUrl: string
}

// --- VideoCard ---
function VideoCard({ video, onClick }: { video: Video; onClick: (v: Video) => void }) {
  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer"
      onClick={() => onClick(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(video)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Play ${video.title}`}
    >
      <div className="relative">
        <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{video.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{video.channel}</p>
      </div>
    </div>
  )
}

// --- Home component: fetch once and loop over API response to show cards ---
export default function Home() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Authentication check - redirect if user is not authenticated
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')

        if (!token) {
          // User is not authenticated, redirect to login
          router.push('/')
          return
        }
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [router])



  const mapApiVideo = (v: ApiVideo): Video => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail_url,
    channel: v.author_Name,
    videoUrl: v.video_url,
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch("/api/ytv/getall", { method: "GET", headers, cache: "no-store" })

        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          throw new Error(`Server returned ${res.status}${txt ? `: ${txt}` : ""}`)
        }

        const body: ApiResponse = await res.json()
        if (!body.success) throw new Error(body.error ?? "API returned success: false")

        // Map API response directly to Video[] and set state
        const list = (body.value || []).map(mapApiVideo)
        // Optional dedupe by id just in case
        const seen = new Set<number>()
        const deduped: Video[] = []
        for (const item of list) {
          if (!seen.has(item.id)) {
            seen.add(item.id)
            deduped.push(item)
          }
        }
        setVideos(deduped)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Show nothing while checking authentication to prevent UI flicker
  if (isChecking) {
    return null
  }

  const handleVideoClick = (video: Video) => {
    // Navigate to watch page with video ID
    router.push(`/home/showvideo?id=${video.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onClick={handleVideoClick} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
        </div>
      )}

      {!loading && videos.length === 0 && <p className="text-center text-gray-600 mt-8">لا توجد مقاطع للعرض</p>}


    </div>
  )
}