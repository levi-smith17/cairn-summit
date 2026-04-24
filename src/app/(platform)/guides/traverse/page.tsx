import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuidePassClient } from '../[guideId]/pass/components/guide-pass-client'

interface TraversePageProps {
  searchParams: Promise<{ guides?: string }>
}

export default async function TraversePage({ searchParams }: TraversePageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const { guides: guidesParam } = await searchParams
  const guideIds = guidesParam?.split(',').filter(Boolean) ?? []

  if (guideIds.length < 2) notFound()

  const [guides, markers] = await Promise.all([
    prisma.guide.findMany({
      where: { id: { in: guideIds }, wayfarerId },
      include: {
        stones: {
          include: { markers: { include: { marker: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  if (guides.length < 2) notFound()

  // Preserve the user's selection order
  const orderedGuides = guideIds
    .map(id => guides.find(g => g.id === id))
    .filter(Boolean) as typeof guides

  const allStones = orderedGuides.flatMap(g => g.stones)

  const title = orderedGuides.length <= 2
    ? orderedGuides.map(g => g.name).join(' · ')
    : `${orderedGuides[0].name} · ${orderedGuides[1].name} +${orderedGuides.length - 2} more`

  return (
    <GuidePassClient
      title={title}
      stones={allStones}
      allMarkers={markers}
      backUrl="/guides"
      guideIds={guideIds}
    />
  )
}
