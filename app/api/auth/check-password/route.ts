import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        // 1. First, try to login with credentials to verify password
        const loginResponse = await fetch('http://pureplay.runasp.net/v1/Auth/Login/Email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })

        const loginData = await loginResponse.json()

        if (loginData.success) {
            return NextResponse.json({ success: true, message: "Password verified" })
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
