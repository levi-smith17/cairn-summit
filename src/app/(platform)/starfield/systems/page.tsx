import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SystemsClient } from './components/systems-client'

export default async function SystemsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const systems = await prisma.sfSystem.findMany({
    orderBy: { name: 'asc' },
    include: {
      planets: {
        orderBy: { name: 'asc' },
        include: {
          facilities: {
            orderBy: { name: 'asc' },
            include: {
              planet: true,
            },
          },
        },
      },
    },
  })

  return <SystemsClient systems={systems} />
}