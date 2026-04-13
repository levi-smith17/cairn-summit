import { createHmac } from 'crypto'

export const IMPERSONATE_COOKIE = 'cairn_impersonate'

export function signImpersonate(targetId: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev'
  return createHmac('sha256', secret).update(targetId).digest('hex')
}

export function verifyImpersonateCookie(raw: string): string | null {
  const [targetId, sig] = raw.split(':')
  if (!targetId || !sig) return null
  const expected = signImpersonate(targetId)
  return expected === sig ? targetId : null
}
