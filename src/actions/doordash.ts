'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function saveSession({
  id,
  date,
  gasPrice,
  mpg,
  startOdometer,
  endOdometer,
  notes,
}: {
  id?: string
  date: Date
  gasPrice: number
  mpg: number
  startOdometer?: number | null
  endOdometer?: number | null
  notes?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const data = { date, gasPrice, mpg, startOdometer, endOdometer, notes }

  if (id) {
    await prisma.ddSession.update({ where: { id }, data })
  } else {
    await prisma.ddSession.create({ data: { ...data, userId: session.user.id } })
  }
  revalidatePath('/doordash')
}

export async function deleteSession(id: string) {
  await prisma.ddSession.delete({ where: { id } })
  revalidatePath('/doordash')
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function saveOrder({
  id,
  sessionId,
  deliveryMiles,
  pickupMiles,
  notes,
}: {
  id?: string
  sessionId: string
  deliveryMiles: number
  pickupMiles?: number | null
  notes?: string | null
}) {
  const data = { deliveryMiles, pickupMiles, notes }

  if (id) {
    await prisma.ddOrder.update({ where: { id }, data })
  } else {
    await prisma.ddOrder.create({ data: { ...data, sessionId } })
  }
  revalidatePath('/doordash')
}

export async function deleteOrder(id: string) {
  await prisma.ddOrder.delete({ where: { id } })
  revalidatePath('/doordash')
}
