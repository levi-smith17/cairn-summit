import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/nav/page-header'
import { MessagesClient } from './components/messages-client'

export default async function MessagesPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const wayfarerId = session.user.id

    const messages = await prisma.message.findMany({
        where: { wayfarerId },
        orderBy: { createdAt: 'desc' },
        include: { replies: { orderBy: { createdAt: 'asc' } } },
    })

    return (
        <>
            <PageHeader title="Messages" />
            <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
                <MessagesClient messages={messages} />
            </div>
        </>
    )
}
