import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const wayfarerId = session.user.id
    const searchParams = req.nextUrl.searchParams

    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const markerId = searchParams.get('markerId')
    const page = parseInt(searchParams.get('page') ?? '1')
    const skip = (page - 1) * PAGE_SIZE

    const where: any = { wayfarerId }
    if (markerId) where.markers = { some: { markerId } }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
        ]
    }
    if (month && year) {
        const start = new Date(parseInt(year), parseInt(month) - 1, 1)
        const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
        where.date = { gte: start, lte: end }
    } else if (dateFrom || dateTo) {
        where.date = {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
        }
    }

    const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' },
            skip,
            take: PAGE_SIZE,
            include: { markers: { include: { marker: true } } },
        }),
        prisma.expense.count({ where }),
    ])

    return NextResponse.json({ expenses, total, page, pageSize: PAGE_SIZE, hasMore: skip + PAGE_SIZE < total })
}
