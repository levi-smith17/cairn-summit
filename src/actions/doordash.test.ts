import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    ddSession: {
      create: vi.fn().mockResolvedValue({ id: 'session-1' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn(),
    },
    ddOrder: {
      create: vi.fn().mockResolvedValue({ id: 'order-1' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { saveSession, deleteSession, saveOrder, deleteOrder } from './doordash'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma, true)

const USER_ID = 'user-abc'
const authed = () => mockAuth.mockResolvedValue({ user: { id: USER_ID } } as any)
const unauthed = () => mockAuth.mockResolvedValue(null as any)

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── saveSession ──────────────────────────────────────────────────────────────

describe('saveSession', () => {
  const sessionData = {
    date: new Date('2026-03-18'),
    gasPrice: 3.459,
    mpg: 32,
  }

  it('throws Unauthorized when not authenticated', async () => {
    unauthed()
    await expect(saveSession(sessionData)).rejects.toThrow('Unauthorized')
  })

  it('creates a new session scoped to the authenticated user', async () => {
    authed()
    await saveSession(sessionData)
    expect(mockPrisma.ddSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ wayfarerId: USER_ID }) })
    )
  })

  it('updates using the ownership filter when an id is provided', async () => {
    authed()
    await saveSession({ ...sessionData, id: 'session-1' })
    expect(mockPrisma.ddSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'session-1', wayfarerId: USER_ID }) })
    )
  })
})

// ─── deleteSession ────────────────────────────────────────────────────────────

describe('deleteSession', () => {
  it('throws Unauthorized when not authenticated', async () => {
    unauthed()
    await expect(deleteSession('session-1')).rejects.toThrow('Unauthorized')
  })

  it('deletes using the ownership filter', async () => {
    authed()
    await deleteSession('session-1')
    expect(mockPrisma.ddSession.deleteMany).toHaveBeenCalledWith({
      where: { id: 'session-1', wayfarerId: USER_ID },
    })
  })

  it('does not attempt deletion when unauthenticated', async () => {
    unauthed()
    await expect(deleteSession('session-1')).rejects.toThrow()
    expect(mockPrisma.ddSession.deleteMany).not.toHaveBeenCalled()
  })
})

// ─── saveOrder ────────────────────────────────────────────────────────────────

describe('saveOrder', () => {
  const orderData = { sessionId: 'session-1', deliveryMiles: 5.2 }

  it('throws Unauthorized when not authenticated', async () => {
    unauthed()
    await expect(saveOrder(orderData)).rejects.toThrow('Unauthorized')
  })

  it('verifies session ownership before creating an order', async () => {
    authed()
    mockPrisma.ddSession.findFirst.mockResolvedValue({ id: 'session-1', wayfarerId: USER_ID } as any)
    await saveOrder(orderData)
    expect(mockPrisma.ddSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'session-1', wayfarerId: USER_ID } })
    )
    expect(mockPrisma.ddOrder.create).toHaveBeenCalled()
  })

  it('throws when the session does not belong to the user', async () => {
    authed()
    mockPrisma.ddSession.findFirst.mockResolvedValue(null)
    await expect(saveOrder(orderData)).rejects.toThrow('Not found')
    expect(mockPrisma.ddOrder.create).not.toHaveBeenCalled()
  })

  it('updates using the session ownership filter when an id is provided', async () => {
    authed()
    await saveOrder({ ...orderData, id: 'order-1' })
    expect(mockPrisma.ddOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'order-1', session: { wayfarerId: USER_ID } }),
      })
    )
  })
})

// ─── deleteOrder ──────────────────────────────────────────────────────────────

describe('deleteOrder', () => {
  it('throws Unauthorized when not authenticated', async () => {
    unauthed()
    await expect(deleteOrder('order-1')).rejects.toThrow('Unauthorized')
  })

  it('deletes using the session ownership filter', async () => {
    authed()
    await deleteOrder('order-1')
    expect(mockPrisma.ddOrder.deleteMany).toHaveBeenCalledWith({
      where: { id: 'order-1', session: { wayfarerId: USER_ID } },
    })
  })

  it('does not attempt deletion when unauthenticated', async () => {
    unauthed()
    await expect(deleteOrder('order-1')).rejects.toThrow()
    expect(mockPrisma.ddOrder.deleteMany).not.toHaveBeenCalled()
  })
})
