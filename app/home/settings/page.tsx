"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Types for YTV
type YtvItem = {
    id: number
    title: string
    video_url: string
    author_Name: string
}

export default function SettingsPage() {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [loadingAuth, setLoadingAuth] = useState(true)

    // Reset Password State
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [loadingPassword, setLoadingPassword] = useState(false)

    // YTV State
    const [ytvList, setYtvList] = useState<YtvItem[]>([])
    const [ytvLoading, setYtvLoading] = useState(false)
    const [ytvError, setYtvError] = useState<string | null>(null)
    const [newYtvUrl, setNewYtvUrl] = useState("")
    const [addingYtv, setAddingYtv] = useState(false)

    useEffect(() => {
        // Check for session access flag - Time-based validity (10 seconds)
        // This prevents double-mount issues in React Strict Mode while ensuring ephemeral access
        const accessTimestamp = sessionStorage.getItem("settings_temp_access")

        let isValid = false
        if (accessTimestamp) {
            const time = parseInt(accessTimestamp, 10)
            if (!isNaN(time)) {
                // Check if token is within 10 seconds of creation
                if (Date.now() - time < 10000) {
                    isValid = true
                }
            }
        }

        if (!isValid) {
            router.push("/home/settings/guard")
        } else {
            setIsAuthorized(true)
            fetchYtvList() // Load initial data
        }
        setLoadingAuth(false)
    }, [router])

    const fetchYtvList = async () => {
        setYtvLoading(true)
        setYtvError(null)
        try {
            const token = localStorage.getItem("authToken")
            if (!token) return

            const res = await fetch("/api/ytv/getall", { // Using existing proxy or direct if configured?
                // Wait, user requirement says reuse /app/api helpers or read base URL.
                // Existing /app/home/page.tsx uses /api/ytv/getall (proxied).
                // Let's assume we can use the same endpoint if it exists or use our direct fetch logic.
                // The prompt asked to create GET /v1/YTV/GetAllYTV wrapper? 
                // Wait, existing /api/ytv/getall already exists. Let's use it.
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            })

            if (!res.ok) throw new Error("Failed to fetch")

            const data = await res.json()
            if (data.success) {
                setYtvList(data.value)
            } else {
                setYtvError(data.error || "Failed to load list")
            }
        } catch (e) {
            setYtvError("Failed to fetch YTV list")
        } finally {
            setYtvLoading(false)
        }
    }

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: "New passwords do not match" })
            return
        }

        setLoadingPassword(true)
        setPasswordMsg(null)

        try {
            const token = localStorage.getItem("authToken")
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: oldPassword,
                    newPassword: newPassword
                })
            })

            const data = await res.json()
            if (data.success) {
                setPasswordMsg({ type: 'success', text: "Password verified and changed successfully" })
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                setPasswordMsg({ type: 'error', text: data.error || "Failed to reset password" })
            }
        } catch (e) {
            setPasswordMsg({ type: 'error', text: "An error occurred" })
        } finally {
            setLoadingPassword(false)
        }
    }

    const handleAddYtv = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newYtvUrl) return

        setAddingYtv(true)
        try {
            const token = localStorage.getItem("authToken")
            const res = await fetch("/api/ytv/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    YTVUrl: newYtvUrl
                })
            })
            const data = await res.json()
            if (data.success) {
                setNewYtvUrl("")
                fetchYtvList() // Refresh list
            } else {
                setYtvError(data.error || "Failed to add video")
            }
        } catch (e) {
            setYtvError("Error adding video")
        } finally {
            setAddingYtv(false)
        }
    }

    const handleDeleteYtv = async (id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        try {
            const token = localStorage.getItem("authToken")
            const res = await fetch(`/api/ytv/delete/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            })

            if (res.ok) { // checking ok or json success depending on implementation
                fetchYtvList()
            } else {
                setYtvError("Failed to delete")
            }
        } catch (e) {
            setYtvError("Error deleting video")
        }
    }


    const handleLogout = () => {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
            sessionStorage.removeItem("settings_access")
            router.push("/")
        }
    }

    if (loadingAuth || !isAuthorized) return null

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Settings</h1>
                <Button variant="destructive" onClick={handleLogout}>
                    Logout
                </Button>
            </div>

            <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password">Reset Password</TabsTrigger>
                    <TabsTrigger value="ytv">YTV Management</TabsTrigger>
                </TabsList>

                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password securely.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {passwordMsg && (
                                <Alert variant={passwordMsg.type === 'error' ? "destructive" : "default"} className={passwordMsg.type === 'success' ? "border-green-500 text-green-700" : ""}>
                                    <AlertTitle>{passwordMsg.type === 'error' ? "Error" : "Success"}</AlertTitle>
                                    <AlertDescription>{passwordMsg.text}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="current">Current Password</Label>
                                <Input id="current" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">New Password</Label>
                                <Input id="new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirm New Password</Label>
                                <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handlePasswordReset} disabled={loadingPassword}>
                                {loadingPassword ? "Updating..." : "Update Password"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="ytv">
                    <Card>
                        <CardHeader>
                            <CardTitle>YTV Items</CardTitle>
                            <CardDescription>
                                Manage your YouTube Video items here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add New Form */}
                            <div className="flex flex-col sm:flex-row gap-4 items-end border-b pb-6">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="ytv-url">YouTube URL</Label>
                                    <Input id="ytv-url" placeholder="https://youtube.com..." value={newYtvUrl} onChange={e => setNewYtvUrl(e.target.value)} />
                                </div>
                                <Button onClick={handleAddYtv} disabled={addingYtv}>
                                    {addingYtv ? "Adding..." : "Add"}
                                </Button>
                            </div>

                            {/* Error Message */}
                            {ytvError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{ytvError}</AlertDescription>
                                </Alert>
                            )}

                            {/* List */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Video URL</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ytvLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                            </TableRow>
                                        ) : ytvList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No items found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            ytvList.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.id}</TableCell>
                                                    <TableCell>{item.title}</TableCell>
                                                    <TableCell className="truncate max-w-[200px]">{item.video_url}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteYtv(item.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
