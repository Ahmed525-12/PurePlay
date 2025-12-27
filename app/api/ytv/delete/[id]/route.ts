import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        const authHeader = request.headers.get('Authorization')

        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Note: The backend endpoint seems to be {id} in path based on requirement
        // "DELETE /v1/YTV/DeleteYTV/{id}"
        const response = await fetch(`http://pureplay.runasp.net/v1/YTV/DeleteYTV/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
        })

        // Invalidate cache on success
        if (response.ok) {
            revalidatePath('/home', 'layout')
        }

        // Some endpoints might return 204 No Content
        if (response.status === 204) {
            return NextResponse.json({ success: true })
        }

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
