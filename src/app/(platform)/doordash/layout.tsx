import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export default async function DoordashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const wayfarer = await prisma.wayfarer.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!wayfarer?.isAdmin) notFound()

  return <>{children}</>
}
