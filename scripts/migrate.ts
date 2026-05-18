/**
 * Migration: Supabase (Prisma) → DynamoDB
 *
 * Prerequisites:
 *   - Adjacent cairn project has node_modules installed (npm install in ../cairn)
 *   - AWS credentials configured for the target account
 *   - Cognito user pool already populated (users must exist before migration)
 *
 * Required env vars:
 *   DATABASE_URL           Supabase pooled connection string (from ../cairn/.env)
 *   DYNAMODB_TABLE         e.g. cairn-dev
 *   COGNITO_USER_POOL_ID   e.g. us-east-1_xxxxxxxxx
 *   AWS_REGION             e.g. us-east-1
 *   AWS_PROFILE            e.g. cairn-dev
 *
 * Optional env vars:
 *   USER_MAP               Inline JSON mapping old Supabase email → Cognito sub.
 *                          Use this when the Cognito email differs from Supabase,
 *                          or to manually pin a user to a specific sub.
 *                          Example: USER_MAP='{"old@example.com":"us-east-1:abc-123"}'
 *
 *   USER_MAP_FILE          Path to a JSON file with the same mapping format.
 *                          Takes precedence over USER_MAP.
 *                          Example file content: { "old@example.com": "cognito-sub-here" }
 *
 * Run from repo root:
 *   DATABASE_URL="postgresql://..." \
 *   DYNAMODB_TABLE=cairn-dev \
 *   COGNITO_USER_POOL_ID=us-east-1_xxx \
 *   AWS_REGION=us-east-1 \
 *   AWS_PROFILE=cairn-dev \
 *   npx ts-node scripts/migrate.ts
 *
 * The script is idempotent — re-running will overwrite existing items.
 * ICloud calendars are skipped (contain encrypted passwords, re-add manually).
 * Starfield data is skipped (different schema; use migrate-systems.ts for that).
 */

import { createRequire } from 'module'
import { join } from 'path'
import { readFileSync } from 'fs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'

// ---------------------------------------------------------------------------
// Load Prisma from the adjacent cairn project (already installed there)
// ---------------------------------------------------------------------------
const cairnDir = join(process.cwd(), '../cairn')
const cairnRequire = createRequire(join(cairnDir, 'package.json'))
const { PrismaClient } = cairnRequire('@prisma/client')

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const TABLE_NAME = process.env.DYNAMODB_TABLE ?? 'cairn-dev'
const REGION = process.env.AWS_REGION ?? 'us-east-1'
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID

if (!USER_POOL_ID) {
    console.error('COGNITO_USER_POOL_ID is required')
    process.exit(1)
}

const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: REGION }),
    { marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false } }
)

const cognito = new CognitoIdentityProviderClient({ region: REGION })

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
})

// ---------------------------------------------------------------------------
// User map (optional): old Supabase email → Cognito sub
// ---------------------------------------------------------------------------
function loadUserMap(): Record<string, string> {
    if (process.env.USER_MAP_FILE) {
        const raw = readFileSync(process.env.USER_MAP_FILE, 'utf-8')
        return JSON.parse(raw)
    }
    if (process.env.USER_MAP) {
        return JSON.parse(process.env.USER_MAP)
    }
    return {}
}

const USER_MAP = loadUserMap()

if (Object.keys(USER_MAP).length > 0) {
    console.log(`User map loaded: ${Object.keys(USER_MAP).length} override(s)`)
    for (const [email, sub] of Object.entries(USER_MAP)) {
        console.log(`  ${email} → ${sub}`)
    }
    console.log()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoOrNull(d: Date | null | undefined): string | null {
    return d ? d.toISOString() : null
}

async function batchWrite(items: Record<string, unknown>[]) {
    for (let i = 0; i < items.length; i += 25) {
        const chunk = items.slice(i, i + 25)
        let pending = chunk.map(Item => ({ PutRequest: { Item } }))
        let attempt = 0

        while (pending.length > 0) {
            if (attempt > 0) {
                // Exponential backoff: 200ms, 400ms, 800ms, …  capped at 5s
                await new Promise(r => setTimeout(r, Math.min(200 * 2 ** (attempt - 1), 5000)))
            }
            const res = await dynamo.send(new BatchWriteCommand({
                RequestItems: { [TABLE_NAME]: pending },
            }))
            // DynamoDB may return unprocessed items when throughput is exceeded
            pending = (res.UnprocessedItems?.[TABLE_NAME] ?? []) as typeof pending
            attempt++
            if (attempt > 10) throw new Error('batchWrite: too many retries — still have unprocessed items')
        }
    }
}

async function getCognitoSub(email: string): Promise<string | null> {
    if (USER_MAP[email]) return USER_MAP[email]

    const res = await cognito.send(new ListUsersCommand({
        UserPoolId: USER_POOL_ID!,
        Filter: `email = "${email}"`,
        Limit: 1,
    }))
    const user = res.Users?.[0]
    return user?.Username ?? null
}

function buildMarkerMap(markers: any[]): Map<string, { id: string; name: string; color: string; icon?: string }> {
    const map = new Map<string, { id: string; name: string; color: string; icon?: string }>()
    for (const m of markers) {
        map.set(m.id, { id: m.id, name: m.name, color: m.color, ...(m.icon ? { icon: m.icon } : {}) })
    }
    return map
}

function resolveMarkers(
    joinRows: { markerId: string }[],
    markerMap: Map<string, any>
): { id: string; name: string; color: string; icon?: string }[] {
    return joinRows.flatMap(row => {
        const m = markerMap.get(row.markerId)
        return m ? [m] : []
    })
}

// ---------------------------------------------------------------------------
// Per-user migration
// ---------------------------------------------------------------------------

async function migrateUser(wayfarer: any): Promise<void> {
    const email = wayfarer.email
    if (!email) {
        console.warn(`  ⚠ Skipping wayfarer ${wayfarer.id} — no email`)
        return
    }

    const cognitoSub = await getCognitoSub(email)
    if (!cognitoSub) {
        console.warn(`  ⚠ Skipping ${email} — no matching Cognito user`)
        return
    }

    const pk = `USER#${cognitoSub}`
    const markerMap = buildMarkerMap(wayfarer.markers)
    const items: Record<string, unknown>[] = []

    // -------------------------------------------------------------------------
    // PROFILE (wayfarer + origins)
    // -------------------------------------------------------------------------
    const o = wayfarer.origins
    items.push({
        pk,
        sk: 'PROFILE',
        name: wayfarer.name ?? null,
        email: wayfarer.email,
        username: wayfarer.username ?? null,
        image: wayfarer.image ?? null,
        customDomain: wayfarer.customDomain ?? null,
        isAdmin: wayfarer.isAdmin,
        listed: wayfarer.listed,
        defaultTerminology: wayfarer.defaultTerminology,
        defaultTheme: wayfarer.defaultTheme,
        timeFormat: wayfarer.timeFormat,
        // Origins fields
        headline: o?.headline ?? null,
        summary: o?.summary ?? null,
        bio: o?.bio ?? null,
        location: o?.location ?? null,
        website: o?.website ?? null,
        linkedin: o?.linkedin ?? null,
        github: o?.github ?? null,
        createdAt: wayfarer.createdAt.toISOString(),
    })

    // -------------------------------------------------------------------------
    // SETTINGS (all 7 settings tables collapsed)
    // -------------------------------------------------------------------------
    const as = wayfarer.appearanceSettings
    const ns = wayfarer.notificationSettings
    const ps = wayfarer.privacySettings
    const is = wayfarer.itinerarySettings
    const ws = wayfarer.waypointSettings
    const ls = wayfarer.logSettings
    const ss = wayfarer.signalSettings

    items.push({
        pk,
        sk: 'SETTINGS',
        appearance: as ? {
            sidebarDefault: as.sidebarDefault,
            defaultLandingPage: as.defaultLandingPage,
            dateFormat: as.dateFormat,
        } : null,
        notifications: ns ? {
            browserNotifications: ns.browserNotifications,
            notificationSound: ns.notificationSound,
            emailDigest: ns.emailDigest,
        } : null,
        privacy: ps ? {
            manifestVisibility: ps.manifestVisibility,
            contactFormEnabled: ps.contactFormEnabled,
        } : null,
        itinerary: is ? {
            defaultView: is.defaultView,
            firstDayOfWeek: is.firstDayOfWeek,
            defaultEventDuration: is.defaultEventDuration,
            showWeekNumbers: is.showWeekNumbers,
        } : null,
        waypoints: ws ? {
            defaultSort: ws.defaultSort,
            openInNewTab: ws.openInNewTab,
            waypointsPerPage: ws.waypointsPerPage,
        } : null,
        logs: ls ? {
            logsPerPage: ls.logsPerPage,
            defaultSort: ls.defaultSort,
        } : null,
        signals: ss ? {
            messagesPerPage: ss.messagesPerPage,
            autoMarkRead: ss.autoMarkRead,
            autoRefreshInterval: ss.autoRefreshInterval,
            defaultView: ss.defaultView,
            compactView: ss.compactView,
            showSnippets: ss.showSnippets,
        } : null,
    })

    // -------------------------------------------------------------------------
    // Trails
    // -------------------------------------------------------------------------
    for (const trail of wayfarer.trails) {
        items.push({
            pk,
            sk: `TRAIL#${trail.id}`,
            name: trail.name,
            createdAt: trail.createdAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Markers
    // -------------------------------------------------------------------------
    for (const marker of wayfarer.markers) {
        items.push({
            pk,
            sk: `MARKER#${marker.id}`,
            name: marker.name,
            color: marker.color,
            ...(marker.icon ? { icon: marker.icon } : {}),
            createdAt: marker.createdAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Waypoints
    // -------------------------------------------------------------------------
    for (const wp of wayfarer.waypoints) {
        const wpItem: Record<string, unknown> = {
            pk,
            sk: `WAYPOINT#${wp.id}`,
            url: wp.url,
            title: wp.title,
            description: wp.description ?? null,
            favicon: wp.favicon ?? null,
            notes: wp.notes ?? null,
            read: wp.read,
            readLater: wp.readLater,
            trailId: wp.trailId ?? null,
            markers: resolveMarkers(wp.markers, markerMap),
            createdAt: wp.createdAt.toISOString(),
        }
        if (wp.trailId) {
            wpItem.gsi1pk = `TRAIL#${wp.trailId}`
            wpItem.gsi1sk = `WAYPOINT#${wp.id}`
        }
        items.push(wpItem)
    }

    // -------------------------------------------------------------------------
    // Logs
    // -------------------------------------------------------------------------
    for (const log of wayfarer.logs) {
        items.push({
            pk,
            sk: `LOG#${log.id}`,
            title: log.title ?? null,
            content: log.content,
            position: log.position ?? null,
            trailId: log.trailId ?? null,
            waypointId: log.waypointId ?? null,
            markers: resolveMarkers(log.markers, markerMap),
            createdAt: log.createdAt.toISOString(),
            updatedAt: log.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Guides + Stones
    // -------------------------------------------------------------------------
    for (const guide of wayfarer.guides) {
        items.push({
            pk,
            sk: `GUIDE#${guide.id}`,
            name: guide.name,
            description: guide.description ?? null,
            trailId: guide.trailId ?? null,
            createdAt: guide.createdAt.toISOString(),
        })

        for (const stone of guide.stones) {
            items.push({
                pk,
                sk: `STONE#${guide.id}#${stone.id}`,
                face: stone.face,
                core: stone.core,
                placement: stone.placement,
                markers: resolveMarkers(stone.markers, markerMap),
                createdAt: stone.createdAt.toISOString(),
            })
        }
    }

    // -------------------------------------------------------------------------
    // Provisions
    // -------------------------------------------------------------------------
    for (const provision of wayfarer.provisions) {
        items.push({
            pk,
            sk: `PROVISION#${provision.id}`,
            name: provision.name,
            amount: provision.amount,
            billingCycle: provision.billingCycle,
            nextRenewal: provision.nextRenewal.toISOString(),
            url: provision.url ?? null,
            notes: provision.notes ?? null,
            active: provision.active,
            markers: resolveMarkers(provision.markers, markerMap),
            createdAt: provision.createdAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Expenses
    // -------------------------------------------------------------------------
    for (const expense of wayfarer.expenses) {
        items.push({
            pk,
            sk: `EXPENSE#${expense.id}`,
            name: expense.name,
            amount: expense.amount,
            date: expense.date.toISOString(),
            notes: expense.notes ?? null,
            receiptUrl: expense.receiptUrl ?? null,
            markers: resolveMarkers(expense.markers, markerMap),
            createdAt: expense.createdAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Budgets
    // -------------------------------------------------------------------------
    for (const budget of wayfarer.budget) {
        items.push({
            pk,
            sk: `BUDGET#${budget.markerId}#${budget.month}#${budget.year}`,
            markerId: budget.markerId,
            limit: budget.limit,
            month: budget.month,
            year: budget.year,
        })
    }

    // -------------------------------------------------------------------------
    // Stops (calendar events)
    // -------------------------------------------------------------------------
    for (const stop of wayfarer.stops) {
        items.push({
            pk,
            sk: `STOP#${stop.id}`,
            title: stop.title,
            notes: stop.notes ?? null,
            location: stop.location ?? null,
            startDate: stop.startDate.toISOString(),
            endDate: isoOrNull(stop.endDate),
            allDay: stop.allDay,
            recurrenceRule: stop.recurrenceRule ?? null,
            exceptionDates: stop.exceptionDates ?? null,
            masterStopId: stop.masterStopId ?? null,
            icloudEventUid: stop.icloudEventUid ?? null,
            icloudEventUrl: stop.icloudEventUrl ?? null,
            markers: resolveMarkers(stop.markers, markerMap),
            createdAt: stop.createdAt.toISOString(),
            updatedAt: stop.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Signals + Replies
    // -------------------------------------------------------------------------
    for (const signal of wayfarer.signals) {
        items.push({
            pk,
            sk: `SIGNAL#${signal.id}`,
            senderName: signal.senderName,
            senderEmail: signal.senderEmail,
            body: signal.body,
            read: signal.read,
            token: signal.token ?? null,
            tokenExpiresAt: isoOrNull(signal.tokenExpiresAt),
            createdAt: signal.createdAt.toISOString(),
        })

        for (const reply of signal.replies) {
            items.push({
                pk,
                sk: `SIGNAL#${signal.id}#REPLY#${reply.id}`,
                body: reply.body,
                direction: reply.direction,
                senderName: reply.senderName ?? null,
                senderEmail: reply.senderEmail ?? null,
                createdAt: reply.createdAt.toISOString(),
            })
        }
    }

    // -------------------------------------------------------------------------
    // Manifest — Expeditions
    // -------------------------------------------------------------------------
    for (const exp of wayfarer.expeditions) {
        items.push({
            pk,
            sk: `EXPEDITION#${exp.id}`,
            title: exp.title,
            company: exp.company,
            location: exp.location ?? null,
            startDate: exp.startDate.toISOString(),
            endDate: isoOrNull(exp.endDate),
            current: exp.current,
            description: exp.description ?? null,
            createdAt: exp.createdAt.toISOString(),
            updatedAt: exp.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Manifest — Training
    // -------------------------------------------------------------------------
    for (const training of wayfarer.training) {
        items.push({
            pk,
            sk: `TRAINING#${training.id}`,
            institution: training.institution,
            degree: training.degree ?? null,
            field: training.field ?? null,
            startDate: training.startDate.toISOString(),
            endDate: isoOrNull(training.endDate),
            current: training.current,
            description: training.description ?? null,
            createdAt: training.createdAt.toISOString(),
            updatedAt: training.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Manifest — Gear
    // -------------------------------------------------------------------------
    for (const gear of wayfarer.gear) {
        items.push({
            pk,
            sk: `GEAR#${gear.id}`,
            name: gear.name,
            category: gear.category ?? null,
            level: gear.level ?? null,
            createdAt: gear.createdAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Manifest — Landmarks
    // -------------------------------------------------------------------------
    for (const landmark of wayfarer.landmarks) {
        items.push({
            pk,
            sk: `LANDMARK#${landmark.id}`,
            name: landmark.name,
            description: landmark.description ?? null,
            url: landmark.url ?? null,
            githubUrl: landmark.githubUrl ?? null,
            startDate: isoOrNull(landmark.startDate),
            endDate: isoOrNull(landmark.endDate),
            current: landmark.current,
            createdAt: landmark.createdAt.toISOString(),
            updatedAt: landmark.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Manifest — Summits
    // -------------------------------------------------------------------------
    for (const summit of wayfarer.summits) {
        items.push({
            pk,
            sk: `SUMMIT#${summit.id}`,
            title: summit.title,
            issuer: summit.issuer ?? null,
            date: isoOrNull(summit.date),
            description: summit.description ?? null,
            url: summit.url ?? null,
            createdAt: summit.createdAt.toISOString(),
            updatedAt: summit.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Manifest — Pathfinding
    // -------------------------------------------------------------------------
    for (const pf of wayfarer.pathfinding) {
        items.push({
            pk,
            sk: `PATHFINDING#${pf.id}`,
            organization: pf.organization,
            role: pf.role ?? null,
            location: pf.location ?? null,
            startDate: pf.startDate.toISOString(),
            endDate: isoOrNull(pf.endDate),
            current: pf.current,
            description: pf.description ?? null,
            createdAt: pf.createdAt.toISOString(),
            updatedAt: pf.updatedAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Manifest — Companions (with embedded media)
    // -------------------------------------------------------------------------
    for (const companion of wayfarer.companions) {
        items.push({
            pk,
            sk: `COMPANION#${companion.id}`,
            name: companion.name,
            species: companion.species,
            breed: companion.breed ?? null,
            birthday: isoOrNull(companion.birthday),
            bio: companion.bio ?? null,
            passed: companion.passed,
            media: companion.media.map((m: any) => ({
                id: m.id,
                key: m.key,
                type: m.type,
                caption: m.caption ?? null,
                order: m.order,
            })),
            createdAt: companion.createdAt.toISOString(),
        })
    }

    // -------------------------------------------------------------------------
    // Calendar subscriptions
    // -------------------------------------------------------------------------
    for (const sub of wayfarer.calendarSubscriptions) {
        items.push({
            pk,
            sk: `CAL_SUB#${sub.id}`,
            name: sub.name,
            url: sub.url,
            color: sub.color,
            createdAt: sub.createdAt.toISOString(),
        })
    }

    // Write all items for this user in batches of 25
    await batchWrite(items)

    console.log(
        `  ✓ ${email} → ${cognitoSub.slice(0, 8)}… (${items.length} items)`
    )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log(`Migrating to table: ${TABLE_NAME}`)
    console.log(`Cognito pool:       ${USER_POOL_ID}`)
    console.log()

    const wayfarers = await prisma.wayfarer.findMany({
        include: {
            origins: true,
            markers: true,
            trails: true,
            waypoints: { include: { markers: true } },
            logs: { include: { markers: true } },
            guides: { include: { stones: { include: { markers: true } } } },
            provisions: { include: { markers: true } },
            expenses: { include: { markers: true } },
            budget: true,
            stops: { include: { markers: true } },
            signals: { include: { replies: true } },
            expeditions: true,
            training: true,
            gear: true,
            landmarks: true,
            summits: true,
            pathfinding: true,
            companions: { include: { media: { orderBy: { order: 'asc' } } } },
            calendarSubscriptions: true,
            appearanceSettings: true,
            notificationSettings: true,
            privacySettings: true,
            itinerarySettings: true,
            waypointSettings: true,
            logSettings: true,
            signalSettings: true,
            // icloudCalendars intentionally excluded — contain encrypted passwords
        },
    })

    console.log(`Found ${wayfarers.length} users in Supabase\n`)

    let succeeded = 0
    let skipped = 0
    let failed = 0

    for (const wayfarer of wayfarers) {
        try {
            await migrateUser(wayfarer)
            succeeded++
        } catch (err: any) {
            console.error(`  ✗ ${wayfarer.email ?? wayfarer.id}: ${err.message}`)
            failed++
        }
    }

    console.log()
    console.log(`Done. Succeeded: ${succeeded}, Skipped: ${skipped}, Failed: ${failed}`)

    if (skipped > 0) {
        console.log()
        console.log('Skipped users were not found in Cognito.')
        console.log('Create their accounts in Cognito first, then re-run.')
    }

    await prisma.$disconnect()
}

main().catch(err => {
    console.error(err)
    prisma.$disconnect()
    process.exit(1)
})
