import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DoordashClient } from './components/doordash-client'

export default async function DoordashPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const sessions = await prisma.ddSession.findMany({
    where: { wayfarerId: session.user.id },
    orderBy: { date: 'desc' },
    include: {
      orders: { orderBy: { createdAt: 'asc' } },
    },
  })

  // Serialize Prisma Decimal fields before passing to client
  const serialized = sessions.map(s => ({
    ...s,
    gasPrice: parseFloat(String(s.gasPrice)),
    mpg: parseFloat(String(s.mpg)),
    startOdometer: s.startOdometer != null ? parseFloat(String(s.startOdometer)) : null,
    endOdometer: s.endOdometer != null ? parseFloat(String(s.endOdometer)) : null,
    orders: s.orders.map(o => ({
      ...o,
      deliveryMiles: parseFloat(String(o.deliveryMiles)),
      pickupMiles: o.pickupMiles != null ? parseFloat(String(o.pickupMiles)) : null,
    })),
  }))

  return <DoordashClient sessions={serialized} />
}
