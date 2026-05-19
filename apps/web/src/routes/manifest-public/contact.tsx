import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getPublicContact } from '@/lib/api/manifest-public'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { FooterNav } from '@/components/nav/footer'
import { ManifestHeader, ManifestHeaderSkeleton } from './manifest-header'
import { ContactContent } from './contact-content'

export default function PublicManifestContact() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()

  const { data, isError } = useQuery({
    queryKey: ['public-manifest-contact', username],
    queryFn: () => getPublicContact(username!),
    enabled: !!username,
    retry: false,
  })

  if (isError) return <Navigate to="/" replace />

  const currentWayfarer = user
    ? { name: user.name ?? null, email: user.email, avatar: user.image ?? null }
    : null

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <ManifestHeaderSkeleton />
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="rounded-xl bg-muted/50 p-6 flex flex-col max-w-md w-full gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
        <div className="pb-6 flex justify-center">
          <FooterNav showCairn={true} />
        </div>
      </div>
    )
  }

  const { wayfarer } = data

  const initials = wayfarer.name
    ? wayfarer.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : wayfarer.email?.[0].toUpperCase() ?? '?'

  const selectedWayfarer = {
    username: username!,
    name: wayfarer.name ?? null,
    email: wayfarer.email ?? null,
    avatar: wayfarer.image ?? null,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ManifestHeader
        wayfarer={selectedWayfarer}
        terminology={wayfarer.defaultTerminology}
        showAvatar={false}
        currentWayfarer={currentWayfarer}
        backTo={`/manifest/${username}`}
      />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="rounded-xl bg-muted/50 p-6 flex flex-col max-w-md w-full gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={wayfarer.image ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">Contact {wayfarer.name ?? username}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Send a message — your email stays private.</p>
            </div>
          </div>

          <ContactContent username={username!} wayfarerName={wayfarer.name} />
        </div>
      </div>

      <div className="pb-6 flex justify-center">
        <FooterNav showCairn={true} />
      </div>
    </div>
  )
}
