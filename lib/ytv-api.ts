

const BASE_URL = 'http://pureplay.runasp.net/v1'

export async function fetchYTVList(token: string) {
    const res = await fetch(`${BASE_URL}/YTV/GetAllYTV`, {
        method: 'GET',
        headers: {
            'Authorization': token, // Token usually includes 'Bearer ' prefix from client or needs it added. 
            // The current route passes "incomingAuth" directly which is the full header value.
            'Content-Type': 'application/json',
        },
        next: {
            tags: ['ytv-list'],
            // Optional: Revalidate every hour as a fallback
            revalidate: 3600
        }
    })

    // We return the raw response object or data? 
    // API routes usually want to handle status codes. 
    // But helper should probably return data.
    // Let's return the response object to allow the API route to handle 401/etc effectively.
    return res
}
