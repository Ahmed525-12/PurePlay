'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import Link from 'next/link'
import SafeVideoPlayer from './SafeVideoPlayer'

function WatchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const videoId = searchParams.get('id')
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

  // Show nothing while checking authentication to prevent UI flicker
  if (isChecking) {
    return null
  }

  if (!videoId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Video Selected</h2>
          <p className="text-gray-600 mb-4">Please select a video to watch</p>
          <Link href="/home" className="inline-block px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center">
      <div className="w-full md:container md:mx-auto px-0 md:px-4 flex items-center justify-center flex-1">
        <div className="w-full md:max-w-5xl">

          <div className="max-w-5xl mx-auto">
            <SafeVideoPlayer
              videoId={videoId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  )
}