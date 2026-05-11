export interface Marker {
    pk: string
    sk: string
    name: string
    color: string
    icon?: string
    createdAt: string
}

export interface ApiResponse<T> {
    data?: T
    error?: string
    statusCode: number
}