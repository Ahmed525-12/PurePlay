'use client'

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  email: string
  password: string
}

interface AuthResponse {
  success: boolean
  value?: {
    email: string
    token: string
  }
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [state, setState] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Authentication check - redirect if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')

        if (token) {
          // User is already authenticated, redirect to home
          router.push('/home')
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Use local API routes that proxy to your backend
      const endpoint = state === 'login'
        ? '/api/auth/login'
        : '/api/auth/register'

      const payload = {
        email: formData.email,
        password: formData.password
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Authentication failed')
      }

      // Save token to localStorage
      if (data.value?.token) {
        localStorage.setItem('authToken', data.value.token)

        // Optionally save user data
        if (data.value) {
          localStorage.setItem('user', JSON.stringify(data.value))
        }

        // Redirect to  or home page
        router.push('/home')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('Authentication error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const toggleState = () => {
    setState(prev => prev === 'login' ? 'register' : 'login')
    setError(null)
    setFormData({ email: '', password: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white"
      >
        <h1 className="text-gray-900 text-3xl mt-10 font-medium">
          {state === 'login' ? 'Login' : 'Sign up'}
        </h1>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center w-full mt-5 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
          </svg>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="border-none outline-none ring-0 flex-1"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="border-none outline-none ring-0 flex-1"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="mt-5 w-full h-11 rounded-full text-white bg-gray-950 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Please wait...' : state === 'login' ? 'Login' : 'Sign up'}
        </button>

        <p className="text-gray-500 text-sm mt-3 mb-11">
          {state === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            type="button"
            onClick={toggleState}
            className="text-gray-950 hover:underline disabled:opacity-50"
            disabled={loading}
          >
            click here
          </button>
        </p>
      </form>
    </div>
  )
}