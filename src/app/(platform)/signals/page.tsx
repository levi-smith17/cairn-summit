import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SignalsClient } from './components/signals-client'

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; account?: string; folder?: string; email?: string; compose?: string; signal?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const { tab, account: accountId, folder, email: emailId, compose, signal: signalId } = await searchParams

  const [signals, imapAccounts, signalSettings] = await Promise.all([
    prisma.signal.findMany({
      where: { wayfarerId },
      orderBy: { createdAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.imapAccount.findMany({
      where: { wayfarerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        label: true,
        emailAddress: true,
        isDefault: true,
      },
    }),
    prisma.signalSettings.findUnique({
      where: { wayfarerId },
      select: { messagesPerPage: true, autoMarkRead: true, autoRefreshInterval: true, defaultView: true, compactView: true, showSnippets: true },
    }),
  ])

  // Determine initial account/folder from URL or defaults
  const initialAccountId = accountId ?? imapAccounts.find(a => a.isDefault)?.id ?? imapAccounts[0]?.id ?? null
  const initialFolder = folder ?? 'INBOX'
  const defaultView = signalSettings?.defaultView ?? 'SIGNALS'
  const initialTab = tab === 'signals'
    ? 'signals'
    : tab === 'email'
      ? 'email'
      : (defaultView === 'EMAIL' && imapAccounts.length > 0 ? 'email' : 'signals')

  // Fetch cached emails for the active account/folder
  const cachedEmails = initialAccountId ? await prisma.cachedEmail.findMany({
    where: { accountId: initialAccountId, mailbox: initialFolder },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      uid: true,
      messageId: true,
      inReplyTo: true,
      subject: true,
      fromName: true,
      fromAddress: true,
      toAddresses: true,
      date: true,
      snippet: true,
      isRead: true,
      isStarred: true,
      hasAttachments: true,
      bodyFetched: true,
      mailbox: true,
    },
  }) : []

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <SignalsClient
        signals={signals}
        imapAccounts={imapAccounts}
        cachedEmails={cachedEmails}
        initialTab={initialTab}
        initialAccountId={initialAccountId}
        initialFolder={initialFolder}
        initialEmailId={emailId ?? null}
        initialSignalId={signalId ?? null}
        initialCompose={compose ?? null}
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
