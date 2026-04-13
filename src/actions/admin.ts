'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarer = await prisma.wayfarer.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  if (!wayfarer?.isAdmin) throw new Error('Forbidden')
  return session.user.id
}

async function logActivity(
  adminId: string,
  action: string,
  targetId?: string,
  targetEmail?: string,
  metadata?: object,
) {
  await prisma.adminActivity.create({
    data: { adminId, action, targetId, targetEmail, metadata: metadata ?? undefined },
  })
}

// ── Wayfarer CRUD ─────────────────────────────────────────────────────────────

export async function saveWayfarer(data: {
  id?: string
  name: string | null
  email: string
  username: string | null
  customDomain: string | null
  isAdmin: boolean
  listed: boolean
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const adminId = await assertAdmin()

    if (data.id) {
      await prisma.wayfarer.update({
        where: { id: data.id },
        data: {
          name:         data.name || null,
          email:        data.email,
          username:     data.username || null,
          customDomain: data.customDomain || null,
          isAdmin:      data.isAdmin,
          listed:       data.listed,
        },
      })
      await logActivity(adminId, 'wayfarer.updated', data.id, data.email)
      revalidatePath('/admin')
      return { ok: true, id: data.id }
    } else {
      const created = await prisma.wayfarer.create({
        data: {
          name:         data.name || null,
          email:        data.email,
          username:     data.username || null,
          customDomain: data.customDomain || null,
          isAdmin:      data.isAdmin,
          listed:       data.listed,
        },
      })
      await logActivity(adminId, 'wayfarer.created', created.id, data.email)
      revalidatePath('/admin')
      return { ok: true, id: created.id }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to save' }
  }
}

export async function deleteWayfarer(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminId = await assertAdmin()
    if (id === adminId) return { ok: false, error: 'Cannot delete your own account' }
    const target = await prisma.wayfarer.findUnique({ where: { id }, select: { email: true } })
    await prisma.wayfarer.delete({ where: { id } })
    await logActivity(adminId, 'wayfarer.deleted', id, target?.email ?? undefined)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete' }
  }
}

// ── Bulk Actions ──────────────────────────────────────────────────────────────

export async function bulkUpdateWayfarers(
  ids: string[],
  patch: { listed?: boolean; isAdmin?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminId = await assertAdmin()
    await prisma.wayfarer.updateMany({ where: { id: { in: ids } }, data: patch })
    await logActivity(adminId, 'wayfarer.bulk_updated', undefined, undefined, { ids, patch })
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update' }
  }
}

export async function bulkDeleteWayfarers(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminId = await assertAdmin()
    if (ids.includes(adminId)) return { ok: false, error: 'Cannot delete your own account' }
    await prisma.wayfarer.deleteMany({ where: { id: { in: ids } } })
    await logActivity(adminId, 'wayfarer.bulk_deleted', undefined, undefined, { ids })
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete' }
  }
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function sendInvitation(data: {
  email: string
  note?: string
}): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const adminId = await assertAdmin()
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await prisma.invitation.create({
      data: {
        email: data.email,
        token,
        invitedById: adminId,
        expiresAt,
        note: data.note || null,
      },
    })
    await logActivity(adminId, 'invitation.sent', undefined, data.email)
    revalidatePath('/admin')
    return { ok: true, token }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to send invitation' }
  }
}

export async function revokeInvitation(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminId = await assertAdmin()
    const inv = await prisma.invitation.findUnique({ where: { id }, select: { email: true } })
    await prisma.invitation.delete({ where: { id } })
    await logActivity(adminId, 'invitation.revoked', id, inv?.email ?? undefined)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to revoke' }
  }
}

export async function acceptInvitation(token: string): Promise<{ ok: boolean; email?: string; error?: string }> {
  try {
    const inv = await prisma.invitation.findUnique({ where: { token } })
    if (!inv) return { ok: false, error: 'Invitation not found' }
    if (inv.usedAt) return { ok: false, error: 'Invitation already used' }
    if (new Date() > inv.expiresAt) return { ok: false, error: 'Invitation has expired' }

    await prisma.invitation.update({ where: { id: inv.id }, data: { usedAt: new Date() } })
    revalidatePath('/admin')
    return { ok: true, email: inv.email }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to accept invitation' }
  }
}

// ── Impersonation ─────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { IMPERSONATE_COOKIE, signImpersonate } from '@/lib/impersonate-cookie'

export async function startImpersonation(targetId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminId = await assertAdmin()
    if (targetId === adminId) return { ok: false, error: 'Cannot impersonate yourself' }

    const sig = signImpersonate(targetId)
    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATE_COOKIE, `${targetId}:${sig}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    const target = await prisma.wayfarer.findUnique({ where: { id: targetId }, select: { email: true } })
    await logActivity(adminId, 'impersonation.started', targetId, target?.email ?? undefined)
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to start impersonation' }
  }
}

export async function stopImpersonation(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATE_COOKIE)?.value
  if (raw) {
    const [targetId] = raw.split(':')
    await logActivity(session.user.id, 'impersonation.stopped', targetId)
    cookieStore.delete(IMPERSONATE_COOKIE)
  }
  revalidatePath('/', 'layout')
}

