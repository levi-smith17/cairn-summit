import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SignalsClient } from './components/signals-client'

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ signal?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const { signal: signalId } = await searchParams

  const [signals, signalSettings] = await Promise.all([
    prisma.signal.findMany({
      where: { wayfarerId },
      orderBy: { createdAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.signalSettings.findUnique({
      where: { wayfarerId },
      select: { messagesPerPage: true, autoMarkRead: true, autoRefreshInterval: true, compactView: true, showSnippets: true },
    }),
  ])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <SignalsClient
        signals={signals}
        initialSignalId={signalId ?? null}
        signalSettings={{
          messagesPerPage:     signalSettings?.messagesPerPage     ?? 25,
          autoMarkRead:        signalSettings?.autoMarkRead        ?? true,
          autoRefreshInterval: signalSettings?.autoRefreshInterval ?? 30,
          compactView:         signalSettings?.compactView         ?? false,
          showSnippets:        signalSettings?.showSnippets        ?? true,
        }}
      />
    </div>
  )
}
