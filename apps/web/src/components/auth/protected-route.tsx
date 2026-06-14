import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center p-4">
                <Skeleton className="h-8 w-48" />
            </div>
        )
    }
    if (!user) return <Navigate to="/login" replace />
    return <Outlet />
}