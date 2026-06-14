import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getAdminData } from '@/lib/api/admin'
import { getProfile } from '@/lib/api/profile'
import { AdminClient } from './admin/admin-client'
import { PageSkeleton } from '@/components/ui/page-skeleton'

export default function Admin() {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user,
  })

  const { data, isError, isLoading } = useQuery({
    queryKey: ['admin'],
    queryFn: getAdminData,
    enabled: !!user && !!profile?.isAdmin,
    retry: false,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  if (loading || profileLoading) {
    return <PageSkeleton title="Admin" />
  }

  if (!user || !profile?.isAdmin || isError) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <PageSkeleton title="Admin" />
  }

  const wayfarers = data?.wayfarers ?? []
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const summary = {
    total:        wayfarers.length,
    newThisMonth: wayfarers.filter(w => new Date(w.createdAt) >= monthStart).length,
    admins:       wayfarers.filter(w => w.isAdmin).length,
    unlisted:     wayfarers.filter(w => !w.listed).length,
  }

  return (
    <AdminClient
      wayfarers={wayfarers}
      summary={summary}
      currentUserId={user.id}
      invitations={data?.invitations ?? []}
      activities={data?.activities ?? []}
      onRefresh={onRefresh}
    />
  )
}
