import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { SignalsClient } from './components/signals-client'

export default async function SignalsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const wayfarerId = session.user.id

    const signals = await prisma.signal.findMany({
        where: { wayfarerId },
        orderBy: { createdAt: 'desc' },
        include: { replies: { orderBy: { createdAt: 'asc' } } },
    })

    return (
        <>
            <PlatformHeader title="Signals" />
            <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
                <SignalsClient signals={signals} />
            </div>
        </>
    )
}
