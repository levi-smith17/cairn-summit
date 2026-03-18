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
  const authSession = await auth()
  if (!authSession?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = authSession.user.id

  const data = { date, gasPrice, mpg, startOdometer, endOdometer, notes }

  if (id) {
    await prisma.ddSession.updateMany({ where: { id, wayfarerId }, data })
  } else {
    await prisma.ddSession.create({ data: { ...data, wayfarerId } })
  }
  revalidatePath('/doordash')
}

export async function deleteSession(id: string) {
  const authSession = await auth()
  if (!authSession?.user?.id) throw new Error('Unauthorized')

  await prisma.ddSession.deleteMany({ where: { id, wayfarerId: authSession.user.id } })
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
  const authSession = await auth()
  if (!authSession?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = authSession.user.id

  const data = { deliveryMiles, pickupMiles, notes }

  if (id) {
    await prisma.ddOrder.updateMany({
      where: { id, session: { wayfarerId } },
      data,
    })
  } else {
    const ownerSession = await prisma.ddSession.findFirst({ where: { id: sessionId, wayfarerId } })
    if (!ownerSession) throw new Error('Not found')
    await prisma.ddOrder.create({ data: { ...data, sessionId } })
  }
  revalidatePath('/doordash')
}

export async function deleteOrder(id: string) {
  const authSession = await auth()
  if (!authSession?.user?.id) throw new Error('Unauthorized')

  await prisma.ddOrder.deleteMany({
    where: { id, session: { wayfarerId: authSession.user.id } },
  })
  revalidatePath('/doordash')
}
