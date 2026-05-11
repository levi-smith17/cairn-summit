export async function sendPrivacyRequest(data: {
    senderName: string
    senderEmail: string
    requestType: string
    message: string
}) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/privacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to send request')
    return res.json()
}