import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getAdminData } from '@/lib/api/admin'
import { AdminClient } from './admin/admin-client'

export default function Admin() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data, isError } = useQuery({
    queryKey: ['admin'],
    queryFn: getAdminData,
    enabled: !!user,
    retry: false,
  })

  if (isError) return (
    <AdminClient
      wayfarers={[]}
      summary={{ total: 0, newThisMonth: 0, admins: 0, unlisted: 0 }}
      currentUserId={user?.id ?? ''}
      invitations={[]}
      activities={[]}
      onRefresh={onRefresh}
    />
  )

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
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
      currentUserId={user?.id ?? ''}
      invitations={data?.invitations ?? []}
      activities={data?.activities ?? []}
      onRefresh={onRefresh}
    />
  )
}
