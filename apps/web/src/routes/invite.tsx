import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { getInvite } from '@/lib/api/invite'

export default function Invite() {
  const { token } = useParams<{ token: string }>()

  const { data, isError, isLoading } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => getInvite(token!),
    enabled: !!token,
    retry: false,
  })

  const invalid = !isLoading && isError
  const expired = data && !data.usedAt && new Date() > new Date(data.expiresAt)
  const used = data?.usedAt

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PlatformStudioContextBar aria-label="Invitation" title="Invitation" />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-muted/50 p-6">
          {isLoading ? null : invalid ? (
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Invitation not found</p>
              <p className="text-sm text-muted-foreground">
                This link is invalid or has already been removed.
              </p>
            </div>
          ) : expired ? (
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Invitation expired</p>
              <p className="text-sm text-muted-foreground">
                This invite expired on {format(new Date(data!.expiresAt), 'MMMM d, yyyy')}. Ask the
                sender to issue a new one.
              </p>
            </div>
          ) : used ? (
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Already used</p>
              <p className="text-sm text-muted-foreground">This invitation has already been accepted.</p>
              <Link
                to="/login"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Sign in
              </Link>
            </div>
          ) : data ? (
            <>
              <div className="space-y-1 text-center">
                <p className="text-sm text-muted-foreground">
                  {data.invitedBy.name ?? data.invitedBy.email} has invited you to join Cairn
                </p>
                <p className="text-xs text-muted-foreground">
                  Invite for <strong>{data.email}</strong> · expires{' '}
                  {format(new Date(data.expiresAt), 'MMM d, yyyy')}
                </p>
                {data.note ? (
                  <p className="mt-2 text-sm italic text-muted-foreground">&ldquo;{data.note}&rdquo;</p>
                ) : null}
              </div>

              <Link
                to={`/signup?email=${encodeURIComponent(data.email)}&invite=${encodeURIComponent(token!)}`}
                className="w-full rounded-md border border-border bg-background px-8 py-2 text-center text-sm tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                Create your account
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
