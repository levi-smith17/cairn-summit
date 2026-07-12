import { useParams, Navigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { useTerminology } from '@/contexts/terminology-context'
import { getThread } from '@/lib/api/thread'
import { ThreadForm } from './thread/thread-form'

export default function Thread() {
  const { token } = useParams<{ token: string }>()
  const { terms } = useTerminology()

  const { data, isError } = useQuery({
    queryKey: ['thread', token],
    queryFn: () => getThread(token!),
    enabled: !!token,
    retry: false,
  })

  if (isError) return <Navigate to="/" replace />
  if (!data) return null

  const expired = !data.tokenExpiresAt || new Date(data.tokenExpiresAt) < new Date()
  const wayfarer = data.wayfarer
  const initials = wayfarer.name
    ? wayfarer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PlatformStudioContextBar
        aria-label={terms.signal}
        title={terms.signal}
        actions={
          wayfarer.username ? (
            <Link
              to={`/manifest/${wayfarer.username}`}
              className="px-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View {wayfarer.name ?? wayfarer.username}&apos;s {terms.manifest.toLowerCase()}
            </Link>
          ) : undefined
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-12 sm:px-6">
          <div className="flex items-center gap-4 pt-8">
            <Avatar className="h-12 w-12">
              <AvatarImage src={wayfarer.image ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">
                Conversation with {wayfarer.name ?? wayfarer.username}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {expired
                  ? 'This conversation link has expired.'
                  : `Link valid until ${format(new Date(data.tokenExpiresAt!), 'MMM d, yyyy')}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex max-w-[80%] flex-col items-start gap-1">
              <span className="px-1 text-xs text-muted-foreground">{data.senderName}</span>
              <div className="whitespace-pre-wrap rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm">
                {data.body}
              </div>
              <span className="px-1 text-xs text-muted-foreground">
                {format(new Date(data.createdAt), 'MMM d, h:mm a')}
              </span>
            </div>

            {data.replies.map((reply) => {
              const isOutbound = reply.direction === 'OUTBOUND'
              return (
                <div
                  key={reply.id}
                  className={`flex max-w-[80%] flex-col gap-1 ${isOutbound ? 'items-end self-end' : 'items-start'}`}
                >
                  <span className="px-1 text-xs text-muted-foreground">
                    {isOutbound ? (wayfarer.name ?? 'Them') : reply.senderName}
                  </span>
                  {isOutbound ? (
                    <div
                      className="prose prose-sm max-w-none rounded-2xl rounded-tr-none bg-primary px-4 py-2.5 text-sm text-primary-foreground [&_*]:text-primary-foreground [&_p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: reply.body }}
                    />
                  ) : (
                    <div
                      className="prose prose-sm max-w-none rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm dark:prose-invert [&_p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: reply.body }}
                    />
                  )}
                  <span className="px-1 text-xs text-muted-foreground">
                    {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              )
            })}
          </div>

          {expired ? (
            <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                This conversation link has expired. To continue,{' '}
                {wayfarer.username ? (
                  <Link
                    to={`/manifest/${wayfarer.username}/contact`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    send a new message
                  </Link>
                ) : null}
                .
              </p>
            </div>
          ) : (
            <ThreadForm token={token!} wayfarerName={wayfarer.name} />
          )}
        </div>
      </div>
    </div>
  )
}
