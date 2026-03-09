import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FoldersClient } from './components/folders-client'
import { NewFolderButton } from './components/new-folder-button'
import { PageHeader } from '@/components/nav/page-header'

export default async function FoldersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const folders = await prisma.folder.findMany({
    where: { wayfarerId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { waypoints: true } } },
  })

  return (
    <>
      <PageHeader
        title="Folders"
        actions={<NewFolderButton />}
      />
      <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
        <FoldersClient folders={folders} />
      </div>
    </>
  )
}