import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

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

const makeEvent = () => ({
    queryStringParameters: {},
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'test-user-id' } } },
    },
})

const makeProfile = (overrides: Record<string, any> = {}) => ({
    pk: 'USER#test-user-id',
    sk: 'PROFILE',
    name: 'Test Wayfarer',
    email: 'test@example.com',
    image: null,
    username: 'testwayfarer',
    headline: 'Software Engineer',
    location: 'Ohio',
    website: 'https://example.com',
    linkedin: null,
    github: 'testwayfarer',
    ...overrides,
})

const makeExpedition = (id: string, startDate: string, endDate?: string) => ({
    pk: 'USER#test-user-id',
    sk: `EXPEDITION#${id}`,
    title: `Company ${id}`,
    company: `Company ${id}`,
    startDate,
    endDate: endDate ?? null,
})

const makeTraining = (id: string, startDate: string) => ({
    pk: 'USER#test-user-id',
    sk: `TRAINING#${id}`,
    institution: `Institution ${id}`,
    degree: `Degree ${id}`,
    startDate,
})

const makeGear = (id: string) => ({
    pk: 'USER#test-user-id',
    sk: `GEAR#${id}`,
    name: `Gear ${id}`,
})

const makeSignal = (id: string, read = false, createdAt = '2024-06-01T00:00:00.000Z') => ({
    pk: 'USER#test-user-id',
    sk: `SIGNAL#${id}`,
    senderName: `Sender ${id}`,
    body: `Body ${id}`,
    read,
    createdAt,
})

const makeStop = (id: string, startDate: string) => ({
    pk: 'USER#test-user-id',
    sk: `STOP#${id}`,
    title: `Stop ${id}`,
    startDate,
    endDate: null,
    allDay: false,
    markers: [],
})

const makeSupplyline = (
    id: string,
    amount: number,
    billingCycle: string,
    active = true,
    nextRenewal = '2099-01-01'
) => ({
    pk: 'USER#test-user-id',
    sk: `SUPPLYLINE#${id}`,
    amount,
    billingCycle,
    active,
    nextRenewal,
})

const makeBurn = (id: string, amount: number, date: string, markers: any[] = []) => ({
    pk: 'USER#test-user-id',
    sk: `BURN#${id}`,
    amount,
    date,
    markers,
})

// ─── Mock helper ──────────────────────────────────────────────────────────────

/**
 * Dispatches by command type + prefix so tests are resilient to query reordering.
 */
function setupMocks(overrides: {
    profile?: any
    expeditions?: any[]
    training?: any[]
    gear?: any[]
    landmarks?: any[]
    summits?: any[]
    pathfinding?: any[]
    companions?: any[]
    supplylines?: any[]
    burns?: any[]
    caches?: any[]
    signals?: any[]
    stops?: any[]
} = {}) {
    const data = {
        profile:     Object.hasOwn(overrides, 'profile') ? overrides.profile : makeProfile(),
        expeditions: overrides.expeditions ?? [],
        training:    overrides.training    ?? [],
        gear:        overrides.gear        ?? [],
        landmarks:   overrides.landmarks   ?? [],
        summits:     overrides.summits     ?? [],
        pathfinding: overrides.pathfinding ?? [],
        companions:  overrides.companions  ?? [],
        supplylines: overrides.supplylines ?? [],
        burns:       overrides.burns       ?? [],
        caches:      overrides.caches      ?? [],
        signals:     overrides.signals     ?? [],
        stops:       overrides.stops       ?? [],
    }

    const prefixMap: Record<string, any[]> = {
        'EXPEDITION#': data.expeditions,
        'TRAINING#':   data.training,
        'GEAR#':       data.gear,
        'LANDMARK#':   data.landmarks,
        'SUMMIT#':     data.summits,
        'PATHFINDING#':data.pathfinding,
        'COMPANION#':  data.companions,
        'SUPPLYLINE#': data.supplylines,
        'BURN#':       data.burns,
        'CACHE#':      data.caches,
        'SIGNAL#':     data.signals,
        'STOP#':       data.stops,
    }

    mockSend.mockImplementation((cmd: any) => {
        if (cmd.constructor.name === 'GetCommand') {
            return Promise.resolve({ Item: data.profile ?? undefined })
        }
        if (cmd.constructor.name === 'QueryCommand') {
            const prefix = cmd.input.ExpressionAttributeValues[':prefix']
            return Promise.resolve({ Items: prefixMap[prefix] ?? [] })
        }
        return Promise.resolve({ Items: [] })
    })
}

function parseBody(result: any) {
    return JSON.parse(result.body)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => vi.resetAllMocks())

// ── Response shape ─────────────────────────────────────────────────────────────

describe('response shape', () => {
    it('returns all top-level sidebar keys', async () => {
        setupMocks()
        const body = parseBody(await handler(makeEvent() as any)).data
        expect(body).toHaveProperty('wayfarer')
        expect(body).toHaveProperty('manifestCounts')
        expect(body).toHaveProperty('manifestHighlights')
        expect(body).toHaveProperty('provisionsSummary')
        expect(body).toHaveProperty('signalsSummary')
        expect(body).toHaveProperty('itinerarySummary')
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

// ── Wayfarer ──────────────────────────────────────────────────────────────────

describe('wayfarer', () => {
    it('returns profile fields correctly', async () => {
        setupMocks({ profile: makeProfile() })
        const { wayfarer } = parseBody(await handler(makeEvent() as any)).data
        expect(wayfarer.name).toBe('Test Wayfarer')
        expect(wayfarer.username).toBe('testwayfarer')
        expect(wayfarer.origins.headline).toBe('Software Engineer')
        expect(wayfarer.origins.github).toBe('testwayfarer')
    })

    it('returns nulls when profile is missing', async () => {
        setupMocks({ profile: null })
        const { wayfarer } = parseBody(await handler(makeEvent() as any)).data
        expect(wayfarer.name).toBeNull()
        expect(wayfarer.email).toBeNull()
        expect(wayfarer.origins.headline).toBeNull()
    })

    it('returns null for optional profile fields that are absent', async () => {
        setupMocks({ profile: makeProfile({ linkedin: undefined, github: undefined }) })
        const { wayfarer } = parseBody(await handler(makeEvent() as any)).data
        expect(wayfarer.origins.linkedin).toBeNull()
        expect(wayfarer.origins.github).toBeNull()
    })
})

// ── Manifest counts ───────────────────────────────────────────────────────────

describe('manifestCounts', () => {
    it('counts each entity type correctly', async () => {
        setupMocks({
            expeditions: [makeExpedition('e1', '2020-01-01'), makeExpedition('e2', '2022-01-01')],
            training:    [makeTraining('t1', '2018-01-01')],
            gear:        [makeGear('g1'), makeGear('g2'), makeGear('g3')],
            landmarks:   [{ sk: 'LANDMARK#l1' }],
            companions:  [{ sk: 'COMPANION#c1' }, { sk: 'COMPANION#c2' }],
        })
        const { manifestCounts } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestCounts.expeditions).toBe(2)
        expect(manifestCounts.training).toBe(1)
        expect(manifestCounts.gear).toBe(3)
        expect(manifestCounts.landmarks).toBe(1)
        expect(manifestCounts.companions).toBe(2)
    })

    it('returns zeros when no entities exist', async () => {
        setupMocks()
        const { manifestCounts } = parseBody(await handler(makeEvent() as any)).data
        expect(Object.values(manifestCounts).every(v => v === 0)).toBe(true)
    })
})

// ── Manifest highlights ───────────────────────────────────────────────────────

describe('manifestHighlights', () => {
    it('returns the most recent expedition', async () => {
        setupMocks({
            expeditions: [
                makeExpedition('e1', '2018-01-01', '2020-01-01'),
                makeExpedition('e2', '2022-01-01'),
            ],
        })
        const { manifestHighlights } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestHighlights.mostRecentExpedition?.title).toBe('Company e2')
    })

    it('returns null mostRecentExpedition when none exist', async () => {
        setupMocks()
        const { manifestHighlights } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestHighlights.mostRecentExpedition).toBeNull()
    })

    it('returns the most recent training entry', async () => {
        setupMocks({
            training: [
                makeTraining('t1', '2015-01-01'),
                makeTraining('t2', '2020-01-01'),
            ],
        })
        const { manifestHighlights } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestHighlights.mostRecentTraining?.institution).toBe('Institution t2')
    })

    it('calculates totalYearsExperience across expeditions', async () => {
        setupMocks({
            expeditions: [makeExpedition('e1', '2020-01-01', '2022-01-01')], // ~2 years
        })
        const { manifestHighlights } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestHighlights.totalYearsExperience).toBe(2)
    })

    it('uses current date for ongoing expeditions (no endDate)', async () => {
        const startDate = new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        setupMocks({ expeditions: [makeExpedition('e1', startDate)] })
        const { manifestHighlights } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestHighlights.totalYearsExperience).toBeGreaterThanOrEqual(1)
    })

    it('returns top 5 gear items', async () => {
        setupMocks({
            gear: Array.from({ length: 8 }, (_, i) => makeGear(`g${i}`)),
        })
        const { manifestHighlights } = parseBody(await handler(makeEvent() as any)).data
        expect(manifestHighlights.topGear).toHaveLength(5)
    })
})

// ── Signals summary ───────────────────────────────────────────────────────────

describe('signalsSummary', () => {
    it('counts unread signals correctly', async () => {
        setupMocks({
            signals: [
                makeSignal('s1', false),
                makeSignal('s2', true),
                makeSignal('s3', false),
            ],
        })
        const { signalsSummary } = parseBody(await handler(makeEvent() as any)).data
        expect(signalsSummary.unreadCount).toBe(2)
    })

    it('excludes reply signals from count and messages', async () => {
        setupMocks({
            signals: [
                makeSignal('s1'),
                { ...makeSignal('s1'), sk: 'SIGNAL#s1#REPLY#r1' },
            ],
        })
        const { signalsSummary } = parseBody(await handler(makeEvent() as any)).data
        expect(signalsSummary.latestMessages).toHaveLength(1)
    })

    it('returns up to 3 latest messages sorted newest first', async () => {
        setupMocks({
            signals: [
                makeSignal('s1', false, '2024-01-01T00:00:00.000Z'),
                makeSignal('s2', false, '2024-06-01T00:00:00.000Z'),
                makeSignal('s3', false, '2024-03-01T00:00:00.000Z'),
                makeSignal('s4', false, '2024-02-01T00:00:00.000Z'),
            ],
        })
        const { latestMessages } = parseBody(await handler(makeEvent() as any)).data.signalsSummary
        expect(latestMessages).toHaveLength(3)
        expect(latestMessages[0].id).toBe('s2')
    })

    it('returns zero unread and empty messages when no signals', async () => {
        setupMocks()
        const { signalsSummary } = parseBody(await handler(makeEvent() as any)).data
        expect(signalsSummary.unreadCount).toBe(0)
        expect(signalsSummary.latestMessages).toHaveLength(0)
    })
})

// ── Itinerary summary ─────────────────────────────────────────────────────────

describe('itinerarySummary', () => {
    it('includes stops starting within the next 4 days', async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        setupMocks({ stops: [makeStop('s1', tomorrow)] })
        const { stops } = parseBody(await handler(makeEvent() as any)).data.itinerarySummary
        expect(stops).toHaveLength(1)
        expect(stops[0].id).toBe('s1')
    })

    it('excludes stops beyond 4 days', async () => {
        const fiveDaysOut = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        setupMocks({ stops: [makeStop('s1', fiveDaysOut)] })
        const { stops } = parseBody(await handler(makeEvent() as any)).data.itinerarySummary
        expect(stops).toHaveLength(0)
    })

    it('excludes past stops', async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        setupMocks({ stops: [makeStop('s1', yesterday)] })
        const { stops } = parseBody(await handler(makeEvent() as any)).data.itinerarySummary
        expect(stops).toHaveLength(0)
    })

    it('sorts upcoming stops chronologically', async () => {
        const d1 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        const d2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        setupMocks({ stops: [makeStop('s2', d2), makeStop('s1', d1)] })
        const { stops } = parseBody(await handler(makeEvent() as any)).data.itinerarySummary
        expect(stops[0].id).toBe('s1')
    })

    it('defaults stop color to #007AFF when no markers', async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        setupMocks({ stops: [makeStop('s1', tomorrow)] })
        const { stops } = parseBody(await handler(makeEvent() as any)).data.itinerarySummary
        expect(stops[0].color).toBe('#007AFF')
    })
})

// ── Provisions summary ────────────────────────────────────────────────────────

describe('provisionsSummary', () => {
    it('normalizes WEEKLY to monthly', async () => {
        setupMocks({ supplylines: [makeSupplyline('sl1', 52, 'WEEKLY')] })
        const { monthlyTotal } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBeCloseTo(52 * 52 / 12, 1)
    })

    it('normalizes BIWEEKLY to monthly', async () => {
        setupMocks({ supplylines: [makeSupplyline('sl1', 100, 'BIWEEKLY')] })
        const { monthlyTotal } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBeCloseTo(100 * 26 / 12, 1)
    })

    it('normalizes QUARTERLY to monthly', async () => {
        setupMocks({ supplylines: [makeSupplyline('sl1', 300, 'QUARTERLY')] })
        const { monthlyTotal } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBe(100)
    })

    it('normalizes ANNUALLY to monthly', async () => {
        setupMocks({ supplylines: [makeSupplyline('sl1', 120, 'ANNUALLY')] })
        const { monthlyTotal } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBe(10)
    })

    it('passes MONTHLY through unchanged', async () => {
        setupMocks({ supplylines: [makeSupplyline('sl1', 100, 'MONTHLY')] })
        const { monthlyTotal } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBe(100)
    })

    it('treats unknown billing cycle as passthrough', async () => {
        setupMocks({ supplylines: [makeSupplyline('sl1', 99, 'UNKNOWN')] })
        const { monthlyTotal } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBe(99)
    })

    it('excludes inactive supplylines', async () => {
        setupMocks({
            supplylines: [
                makeSupplyline('sl1', 100, 'MONTHLY', true),
                makeSupplyline('sl2', 200, 'MONTHLY', false),
            ],
        })
        const { monthlyTotal, activeCount } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBe(100)
        expect(activeCount).toBe(1)
    })

    it('counts upcomingRenewals within 7 days', async () => {
        const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        const tenDaysOut   = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        setupMocks({
            supplylines: [
                makeSupplyline('sl1', 10, 'MONTHLY', true, threeDaysOut),
                makeSupplyline('sl2', 10, 'MONTHLY', true, tenDaysOut),
            ],
        })
        const { upcomingRenewals } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(upcomingRenewals).toBe(1)
    })

    it('returns zero totals when no supplylines exist', async () => {
        setupMocks()
        const { monthlyTotal, activeCount, upcomingRenewals } = parseBody(await handler(makeEvent() as any)).data.provisionsSummary
        expect(monthlyTotal).toBe(0)
        expect(activeCount).toBe(0)
        expect(upcomingRenewals).toBe(0)
    })
})