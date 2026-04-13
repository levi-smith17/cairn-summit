import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyImpersonateCookie, IMPERSONATE_COOKIE } from '@/lib/impersonate-cookie'

/**
 * Returns the impersonated user ID if the current session is an admin
 * actively impersonating another user. Returns null otherwise.
 */
export async function getImpersonatedId(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATE_COOKIE)?.value
  if (!raw) return null

  const targetId = verifyImpersonateCookie(raw)
  if (!targetId) return null

  // Verify the actual session user is still an admin
  const session = await auth()
  if (!session?.user?.id) return null

  const wayfarer = await prisma.wayfarer.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  if (!wayfarer?.isAdmin) return null

  return targetId
}
