"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsGuardPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        // Try to get user email from localStorage for the verification
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    setUserEmail(user.email)
                } catch (e) {
                    console.error("Failed to parse user data")
                }
            }
        }
    }, [])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) {
            setError("Password is required")
            return
        }

        if (!userEmail) {
            setError("User email not found. Please login again.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/check-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, password }),
            })

            const data = await response.json()

            if (data.success) {
                // Set session flag accessible to client side
                // Using sessionStorage so it clears when tab closes
                sessionStorage.setItem("settings_temp_access", Date.now().toString())
                router.push("/home/settings")
            } else {
                setError(data.error || "Verification failed")
            }
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-[80vh] items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Security Check</CardTitle>
                    <CardDescription className="text-center">
                        Please enter your password to access settings.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleVerify}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Verifying..." : "Verify Access"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
