import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getInvite } from '@/lib/api/invite'

export default function Invite() {
  const { token } = useParams<{ token: string }>()

  const { data, isError, isLoading } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => getInvite(token!),
    enabled: !!token,
    retry: false,
  })

  const invalid  = !isLoading && isError
  const expired  = data && !data.usedAt && new Date() > new Date(data.expiresAt)
  const used     = data?.usedAt

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4 sm:px-6">
        {isLoading ? null : invalid ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Invitation not found</p>
            <p className="text-sm text-gray-500">This link is invalid or has already been removed.</p>
          </div>
        ) : expired ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Invitation expired</p>
            <p className="text-sm text-gray-500">
              This invite expired on {format(new Date(data!.expiresAt), 'MMMM d, yyyy')}.
              Ask the sender to issue a new one.
            </p>
          </div>
        ) : used ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Already used</p>
            <p className="text-sm text-gray-500">This invitation has already been accepted.</p>
            <Link to="/login" className="text-sm text-gray-600 underline underline-offset-2">Sign in</Link>
          </div>
        ) : data ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">
                {data.invitedBy.name ?? data.invitedBy.email} has invited you to join Cairn
              </p>
              <p className="text-xs text-gray-400">
                Invite for <strong>{data.email}</strong> · expires {format(new Date(data.expiresAt), 'MMM d, yyyy')}
              </p>
              {data.note && (
                <p className="text-sm text-gray-600 italic mt-2">"{data.note}"</p>
              )}
            </div>

            <Link
              to={`/signup?email=${encodeURIComponent(data.email)}&invite=${encodeURIComponent(token!)}`}
              className="w-full text-center rounded-md border border-gray-300 px-8 py-2 text-sm tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Create your account
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
