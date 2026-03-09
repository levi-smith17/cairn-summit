import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/nav/page-header'
import { ProvisionsClient } from './components/provisions-client'
import { ProvisionActions } from './components/provision-actions'

export default async function ProvisionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const [categories, tags] = await Promise.all([
    prisma.provision.findMany({
      where: { wayfarerId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }).then((rows) => rows.map((r) => r.category)),
    prisma.tag.findMany({
      where: { wayfarerId },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <>
      <PageHeader
        title="Provisions"
        actions={<ProvisionActions categories={categories} tags={tags} />}
      />
      <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
        <ProvisionsClient categories={categories} tags={tags} />
      </div>
    </>
  )
}