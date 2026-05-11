import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getPublicContact } from '@/lib/api/manifest-public'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FooterNav } from '@/components/nav/footer'
import { ManifestHeader } from './manifest-header'
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
  if (!data) return null

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

  const currentWayfarer = user
    ? { name: user.name ?? null, email: user.email, avatar: user.image ?? null }
    : null

  return (
    <div className="relative">
      <ManifestHeader
        wayfarer={selectedWayfarer}
        terminology={wayfarer.defaultTerminology}
        showAvatar={false}
        currentWayfarer={currentWayfarer}
        backTo={`/manifest/${username}`}
      />

      <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-8">
        <div className="flex items-center gap-4 pt-8">
          <Avatar className="h-16 w-16">
            <AvatarImage src={wayfarer.image ?? undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">Contact {wayfarer.name ?? username}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Send a message — your email stays private.</p>
          </div>
        </div>

        <ContactContent username={username!} wayfarerName={wayfarer.name} />

        <FooterNav showCairn={true} />
      </div>
    </div>
  )
}
