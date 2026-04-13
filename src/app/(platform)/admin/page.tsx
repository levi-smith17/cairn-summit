import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AdminClient } from './components/admin-client'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tab?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const self = await prisma.wayfarer.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  if (!self?.isAdmin) redirect('/basecamp')

  const { id, tab } = await searchParams

  const [wayfarers, invitations, activities] = await Promise.all([
    prisma.wayfarer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, username: true,
        customDomain: true, isAdmin: true, listed: true, createdAt: true,
      },
    }),
    prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, note: true, token: true,
        expiresAt: true, usedAt: true, createdAt: true,
        invitedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.adminActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, action: true, targetId: true, targetEmail: true,
        metadata: true, createdAt: true,
        admin: { select: { name: true, email: true } },
      },
    }),
  ])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const summary = {
    total:        wayfarers.length,
    newThisMonth: wayfarers.filter(w => new Date(w.createdAt) >= monthStart).length,
    admins:       wayfarers.filter(w => w.isAdmin).length,
    unlisted:     wayfarers.filter(w => !w.listed).length,
  }

  // Only pass tokens for non-used invitations (admin needs to copy the link)
  const invitationTokens: Record<string, string> = {}
  for (const inv of invitations) {
    if (!inv.usedAt) invitationTokens[inv.id] = inv.token
  }

  // Strip token from what we pass to the client (never expose tokens in client data)
  const invitationsSafe = invitations.map(({ token: _t, ...rest }) => rest)

  return (
    <AdminClient
      wayfarers={wayfarers}
      summary={summary}
      currentUserId={session.user.id}
      initialId={id ?? null}
      invitations={invitationsSafe}
      invitationTokens={invitationTokens}
      activities={activities}
    />
  )
}
