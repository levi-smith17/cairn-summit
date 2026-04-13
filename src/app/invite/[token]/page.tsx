import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { acceptInvitation } from '@/actions/admin'
import { format } from 'date-fns'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // If they arrive here already logged in, mark the invite as used and redirect
  const session = await auth()
  if (session?.user?.email) {
    const inv = await prisma.invitation.findUnique({
      where: { token },
      select: { email: true, usedAt: true, expiresAt: true },
    })
    if (inv && !inv.usedAt && new Date() <= inv.expiresAt && inv.email === session.user.email) {
      await acceptInvitation(token)
    }
    redirect('/basecamp')
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      email: true,
      note: true,
      expiresAt: true,
      usedAt: true,
      invitedBy: { select: { name: true, email: true } },
    },
  })

  const invalid = !invitation
  const expired = invitation && !invitation.usedAt && new Date() > invitation.expiresAt
  const used    = invitation?.usedAt

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4 sm:px-6">
        <img src="/cairn-lockup.svg" alt="Cairn" width={240} height={86} />

        {invalid ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Invitation not found</p>
            <p className="text-sm text-gray-500">This link is invalid or has already been removed.</p>
          </div>
        ) : expired ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Invitation expired</p>
            <p className="text-sm text-gray-500">
              This invite expired on {format(new Date(invitation.expiresAt), 'MMMM d, yyyy')}.
              Ask the sender to issue a new one.
            </p>
          </div>
        ) : used ? (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Already used</p>
            <p className="text-sm text-gray-500">This invitation has already been accepted.</p>
            <a href="/login" className="text-sm text-gray-600 underline underline-offset-2">Sign in</a>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">
                {invitation.invitedBy.name ?? invitation.invitedBy.email} has invited you to join Cairn
              </p>
              <p className="text-xs text-gray-400">
                Invite for <strong>{invitation.email}</strong> · expires {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
              </p>
              {invitation.note && (
                <p className="text-sm text-gray-600 italic mt-2">"{invitation.note}"</p>
              )}
            </div>

            {/* Magic link form pre-filled with invite email */}
            <form
              className="w-full flex flex-col gap-3"
              action={async (formData: FormData) => {
                'use server'
                const { signIn } = await import('@/auth')
                await signIn('nodemailer', {
                  email: formData.get('email'),
                  redirectTo: `/invite/${token}`,
                })
              }}
            >
              <input type="hidden" name="email" value={invitation.email} />
              <button
                type="submit"
                className="w-full rounded-md border border-gray-300 px-8 py-2 text-sm tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
              >
                accept with magic link
              </button>
            </form>

            <div className="flex items-center w-full gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs tracking-widest text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form
              className="w-full"
              action={async () => {
                'use server'
                const { signIn } = await import('@/auth')
                await signIn('github', { redirectTo: `/invite/${token}` })
              }}
            >
              <button
                type="submit"
                className="w-full rounded-md border border-gray-300 px-8 py-2 text-sm tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
              >
                continue with github
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
