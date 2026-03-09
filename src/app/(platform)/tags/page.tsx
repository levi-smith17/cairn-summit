import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NewTagButton } from './components/new-tag-button'
import { TagsClient } from './components/tags-client'
import { PageHeader } from '@/components/nav/page-header'

export default async function TagsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const tags = await prisma.tag.findMany({
    where: { wayfarerId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { waypoints: true } } },
  })

  return (
    <>
      <PageHeader
        title="Tags"
        actions={<NewTagButton />}
      />
      <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
        <TagsClient tags={tags} />
      </div>
    </>
  )
}