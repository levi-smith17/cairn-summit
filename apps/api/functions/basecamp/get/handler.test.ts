import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('../../shared/auth', () => ({
    getPk: () => 'USER#test-user-id',
}))

vi.mock('../../shared/response', async () => {
    const actual = await vi.importActual<typeof import('../../shared/response')>('../../shared/response')
    return actual
})

import { dynamo } from '../../shared/db'
import { handler } from './handler'

const mockSend = dynamo.send as ReturnType<typeof vi.fn>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeEvent = (qs: Record<string, string> = {}) => ({
    queryStringParameters: qs,
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'test-user-id' } } },
    },
})

const makeTrail = (id: string, name: string, createdAt = '2024-01-01T00:00:00.000Z') => ({
    pk: 'USER#test-user-id',
    sk: `TRAIL#${id}`,
    name,
    createdAt,
})

const makeWaypoint = (
    id: string,
    opts: {
        title?: string
        url?: string
        trailId?: string
        read?: boolean
        readLater?: boolean
        markers?: any[]
        createdAt?: string
    } = {}
) => ({
    pk: 'USER#test-user-id',
    sk: `WAYPOINT#${id}`,
    title: opts.title ?? `Waypoint ${id}`,
    url: opts.url ?? `https://example.com/${id}`,
    favicon: null,
    read: opts.read ?? false,
    readLater: opts.readLater ?? false,
    trailId: opts.trailId ?? null,
    markers: opts.markers ?? [],
    createdAt: opts.createdAt ?? '2024-06-01T00:00:00.000Z',
})

const makeMarker = (id: string, name: string, color = '#FF0000') => ({
    pk: 'USER#test-user-id',
    sk: `MARKER#${id}`,
    id,
    name,
    color,
    icon: null,
})

const makeLog = (
    id: string,
    opts: { trailId?: string; waypointId?: string; createdAt?: string } = {}
) => ({
    pk: 'USER#test-user-id',
    sk: `LOG#${id}`,
    content: `Log content ${id}`,
    trailId: opts.trailId ?? null,
    waypointId: opts.waypointId ?? null,
    markers: [],
    createdAt: opts.createdAt ?? '2024-06-01T00:00:00.000Z',
})

// ─── Mock helper ──────────────────────────────────────────────────────────────

function setupMocks(overrides: {
    trails?: any[]
    waypoints?: any[]
    markers?: any[]
    logs?: any[]
} = {}) {
    const data = {
        trails:    overrides.trails    ?? [makeTrail('t1', 'Alpha Trail')],
        waypoints: overrides.waypoints ?? [makeWaypoint('w1', { trailId: 't1' })],
        markers:   overrides.markers   ?? [],
        logs:      overrides.logs      ?? [],
    }

    mockSend.mockImplementation((cmd: any) => {
        if (!(cmd instanceof QueryCommand)) return Promise.resolve({ Items: [] })
        const prefix = cmd.input.ExpressionAttributeValues[':prefix']
        const map: Record<string, any[]> = {
            'TRAIL#':    data.trails,
            'WAYPOINT#': data.waypoints,
            'MARKER#':   data.markers,
            'LOG#':      data.logs,
        }
        return Promise.resolve({ Items: map[prefix] ?? [] })
    })
}

function parseBody(result: any) {
    return JSON.parse(result.body)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks())

// ── Response shape ─────────────────────────────────────────────────────────────

describe('response shape', () => {
    it('returns folders, hasMore, tags, allFolders, filteredCountMap', async () => {
        setupMocks()
        const body = parseBody(await handler(makeEvent() as any)).data
        expect(body).toHaveProperty('folders')
        expect(body).toHaveProperty('hasMore')
        expect(body).toHaveProperty('tags')
        expect(body).toHaveProperty('allFolders')
        expect(body).toHaveProperty('filteredCountMap')
    })

    it('does NOT return sidebarData', async () => {
        setupMocks()
        const body = parseBody(await handler(makeEvent() as any)).data
        expect(body).not.toHaveProperty('sidebarData')
    })

    it('returns 200', async () => {
        setupMocks()
        expect((await handler(makeEvent() as any) as any).statusCode).toBe(200)
    })

    it('returns 500 on DynamoDB error', async () => {
        mockSend.mockRejectedValueOnce(new Error('DynamoDB down'))
        expect((await handler(makeEvent() as any) as any).statusCode).toBe(500)
    })
})

// ── Folder construction ────────────────────────────────────────────────────────

describe('folder construction', () => {
    it('builds a folder per trail with waypoints', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Alpha')],
            waypoints: [makeWaypoint('w1', { trailId: 't1' })],
        })
        const { folders } = parseBody(await handler(makeEvent() as any)).data
        expect(folders).toHaveLength(1)
        expect(folders[0]).toMatchObject({ id: 't1', name: 'Alpha' })
    })

    it('excludes trails with no waypoints and no logs', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Empty'), makeTrail('t2', 'Active')],
            waypoints: [makeWaypoint('w1', { trailId: 't2' })],
        })
        const { folders } = parseBody(await handler(makeEvent() as any)).data
        expect(folders).toHaveLength(1)
        expect(folders[0].id).toBe('t2')
    })

    it('includes trails with logs but no waypoints', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Log-only')],
            waypoints: [],
            logs:      [makeLog('l1', { trailId: 't1' })],
        })
        const { folders } = parseBody(await handler(makeEvent() as any)).data
        expect(folders).toHaveLength(1)
        expect(folders[0]._count.logs).toBe(1)
    })

    it('_count.waypoints reflects unfiltered total', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', title: 'Alpha' }),
                makeWaypoint('w2', { trailId: 't1', title: 'Beta' }),
                makeWaypoint('w3', { trailId: 't1', title: 'Gamma' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ search: 'Alpha' }) as any)).data
        expect(folders[0]._count.waypoints).toBe(3)
    })

    it('caps waypoints per folder at 5', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Big Trail')],
            waypoints: Array.from({ length: 8 }, (_, i) =>
                makeWaypoint(`w${i}`, { trailId: 't1', title: `WP ${i}` })
            ),
        })
        const { folders } = parseBody(await handler(makeEvent() as any)).data
        expect(folders[0].waypoints.length).toBeLessThanOrEqual(5)
    })

    it('attaches only the most recent log to each waypoint', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [makeWaypoint('w1', { trailId: 't1' })],
            logs: [
                makeLog('l1', { waypointId: 'w1', createdAt: '2024-01-01T00:00:00.000Z' }),
                makeLog('l2', { waypointId: 'w1', createdAt: '2024-06-01T00:00:00.000Z' }),
            ],
        })
        const logs = parseBody(await handler(makeEvent() as any)).data.folders[0].waypoints[0].logs
        expect(logs).toHaveLength(1)
        expect(logs[0].id).toBe('l2')
    })

    it('allFolders includes all trails regardless of content', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Active'), makeTrail('t2', 'Empty')],
            waypoints: [makeWaypoint('w1', { trailId: 't1' })],
        })
        const { allFolders } = parseBody(await handler(makeEvent() as any)).data
        expect(allFolders).toHaveLength(2)
    })
})

// ── Filtering ─────────────────────────────────────────────────────────────────

describe('search filter', () => {
    it('matches by title (case-insensitive)', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', title: 'TypeScript Tips' }),
                makeWaypoint('w2', { trailId: 't1', title: 'React Patterns' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ search: 'typescript' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
        expect(folders[0].waypoints[0].title).toBe('TypeScript Tips')
    })

    it('matches by url', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', url: 'https://aws.amazon.com' }),
                makeWaypoint('w2', { trailId: 't1', url: 'https://github.com' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ search: 'github' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
    })

    it('excludes trail when no waypoints match', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [makeWaypoint('w1', { trailId: 't1', title: 'Unrelated' })],
        })
        const { folders } = parseBody(await handler(makeEvent({ search: 'nomatch' }) as any)).data
        expect(folders).toHaveLength(0)
    })
})

describe('markerId filter', () => {
    const markerRef = (id: string) => ({
        id,
        name: 'Tag',
        color: '#FF0000',
        icon: null,
    })

    it('filters by single markerId', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', markers: [markerRef('m1')] }),
                makeWaypoint('w2', { trailId: 't1', markers: [] }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ markerId: 'm1' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
        expect(folders[0].waypoints[0].id).toBe('w1')
    })

    it('filters by multiple markerIds (OR logic)', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', markers: [markerRef('m1')] }),
                makeWaypoint('w2', { trailId: 't1', markers: [markerRef('m2')] }),
                makeWaypoint('w3', { trailId: 't1', markers: [] }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ markerId: 'm1,m2' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(2)
    })
})

describe('trailId filter', () => {
    it('restricts to the specified trail', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Alpha'), makeTrail('t2', 'Beta')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1' }),
                makeWaypoint('w2', { trailId: 't2' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ trailId: 't1' }) as any)).data
        expect(folders).toHaveLength(1)
        expect(folders[0].id).toBe('t1')
    })

    it('treats trailId=all as no filter', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Alpha'), makeTrail('t2', 'Beta')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1' }),
                makeWaypoint('w2', { trailId: 't2' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ trailId: 'all' }) as any)).data
        expect(folders).toHaveLength(2)
    })
})

describe('readLater filter', () => {
    it('returns only readLater waypoints', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', readLater: true }),
                makeWaypoint('w2', { trailId: 't1', readLater: false }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ readLater: 'true' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
        expect(folders[0].waypoints[0].id).toBe('w1')
    })
})

describe('date range filter', () => {
    it('filters by dateFrom (inclusive)', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', createdAt: '2024-03-01T00:00:00.000Z' }),
                makeWaypoint('w2', { trailId: 't1', createdAt: '2024-01-01T00:00:00.000Z' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ dateFrom: '2024-02-01' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
        expect(folders[0].waypoints[0].id).toBe('w1')
    })

    it('filters by dateTo (inclusive)', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', createdAt: '2024-01-01T00:00:00.000Z' }),
                makeWaypoint('w2', { trailId: 't1', createdAt: '2024-06-01T00:00:00.000Z' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ dateTo: '2024-03-01' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
        expect(folders[0].waypoints[0].id).toBe('w1')
    })

    it('filters by dateFrom + dateTo range', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', createdAt: '2024-03-15T00:00:00.000Z' }),
                makeWaypoint('w2', { trailId: 't1', createdAt: '2024-01-01T00:00:00.000Z' }),
                makeWaypoint('w3', { trailId: 't1', createdAt: '2024-06-01T00:00:00.000Z' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent({ dateFrom: '2024-02-01', dateTo: '2024-04-01' }) as any)).data
        expect(folders[0].waypoints).toHaveLength(1)
        expect(folders[0].waypoints[0].id).toBe('w1')
    })
})

// ── Sorting ───────────────────────────────────────────────────────────────────

describe('sort', () => {
    const twoWaypoints = () => ({
        trails:    [makeTrail('t1', 'Trail')],
        waypoints: [
            makeWaypoint('w1', { trailId: 't1', title: 'Zebra', createdAt: '2024-01-01T00:00:00.000Z' }),
            makeWaypoint('w2', { trailId: 't1', title: 'Alpha', createdAt: '2024-06-01T00:00:00.000Z' }),
        ],
    })

    it('sorts alphabetically by default', async () => {
        setupMocks(twoWaypoints())
        const waypoints = parseBody(await handler(makeEvent() as any)).data.folders[0].waypoints
        expect(waypoints[0].title).toBe('Alpha')
    })

    it('sorts newest first', async () => {
        setupMocks(twoWaypoints())
        const waypoints = parseBody(await handler(makeEvent({ sort: 'newest' }) as any)).data.folders[0].waypoints
        expect(waypoints[0].id).toBe('w2')
    })

    it('sorts oldest first', async () => {
        setupMocks(twoWaypoints())
        const waypoints = parseBody(await handler(makeEvent({ sort: 'oldest' }) as any)).data.folders[0].waypoints
        expect(waypoints[0].id).toBe('w1')
    })

    it('sorts trails alphabetically by default', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Zebra Trail'), makeTrail('t2', 'Alpha Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1' }),
                makeWaypoint('w2', { trailId: 't2' }),
            ],
        })
        const { folders } = parseBody(await handler(makeEvent() as any)).data
        expect(folders[0].id).toBe('t2')
    })
})

// ── Pagination ────────────────────────────────────────────────────────────────

describe('pagination', () => {
    it('hasMore is true when trails exceed page size', async () => {
        const trails = Array.from({ length: 16 }, (_, i) => makeTrail(`t${i}`, `Trail ${i}`))
        setupMocks({
            trails,
            waypoints: trails.map(t => makeWaypoint(`w-${t.sk}`, { trailId: t.sk.split('#')[1] })),
        })
        const body = parseBody(await handler(makeEvent() as any)).data
        expect(body.hasMore).toBe(true)
        expect(body.folders).toHaveLength(15)
    })

    it('hasMore is false on last page', async () => {
        setupMocks()
        expect(parseBody(await handler(makeEvent() as any)).data.hasMore).toBe(false)
    })

    it('page 2 returns the next slice', async () => {
        const trails = Array.from({ length: 16 }, (_, i) => makeTrail(`t${i}`, `Trail ${String(i).padStart(2, '0')}`))
        setupMocks({
            trails,
            waypoints: trails.map(t => makeWaypoint(`w-${t.sk}`, { trailId: t.sk.split('#')[1] })),
        })
        const body = parseBody(await handler(makeEvent({ page: '2' }) as any)).data
        expect(body.folders).toHaveLength(1)
        expect(body.hasMore).toBe(false)
    })
})

// ── filteredCountMap ──────────────────────────────────────────────────────────

describe('filteredCountMap', () => {
    it('reflects filtered waypoint count per trail', async () => {
        setupMocks({
            trails:    [makeTrail('t1', 'Trail')],
            waypoints: [
                makeWaypoint('w1', { trailId: 't1', title: 'Match' }),
                makeWaypoint('w2', { trailId: 't1', title: 'Unrelated' }),
            ],
        })
        const { filteredCountMap } = parseBody(await handler(makeEvent({ search: 'Match' }) as any)).data
        expect(filteredCountMap['t1']).toBe(1)
    })
})

// ── Tags ──────────────────────────────────────────────────────────────────────

describe('tags', () => {
    it('returns all markers as tags with correct shape', async () => {
        setupMocks({ markers: [makeMarker('m1', 'Work', '#ABCDEF'), makeMarker('m2', 'Personal')] })
        const { tags } = parseBody(await handler(makeEvent() as any)).data
        expect(tags).toHaveLength(2)
        expect(tags[0]).toMatchObject({ id: 'm1', name: 'Work', color: '#ABCDEF', icon: null })
    })
})