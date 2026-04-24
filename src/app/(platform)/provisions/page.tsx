import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProvisionsClient } from './components/provisions-client'

export default async function ProvisionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const markers = await prisma.marker.findMany({
    where: { wayfarerId },
    orderBy: { name: 'asc' },
  })

  return <ProvisionsClient markers={markers} />
}
