# Cairn Summit — Project Context for Claude Code

## Overview

Cairn Summit (`cairn-summit/cairn`) is a full rewrite of the original Cairn app (`levi-smith17/cairn`), migrating from a Next.js/Vercel/Supabase/Prisma stack to a fully AWS-native serverless architecture. The original app is preserved at `levi-smith17/cairn` and remains live on Vercel as a reference.

Cairn is a personal productivity and life management platform built around a hiking/trail metaphor. Every feature uses trail-inspired terminology.

---

## Terminology Map

| Standard Term | Cairn Term |
|---|---|
| Bookmarks | Waypoints |
| Notes | Logs |
| Finances | Provisions |
| Flashcards | Guides (cards = Stones) |
| Folders | Trails |
| Tags | Markers |
| Calendar | Itinerary |
| Resume | Manifest |
| User | Wayfarer |
| Work Experience | Expeditions |
| Education | Training |
| Skills | Gear |
| Projects | Landmarks |
| Achievements | Summits |
| Volunteering | Pathfinding |
| Pets | Companions |
| Messages | Signals |
| Calendar Events | Stops |

---

## Tech Stack

### Frontend (`apps/web`)
- **Vite** + **React** (replacing Next.js App Router)
- **React Router v7** (replacing Next.js file-based routing)
- **TanStack Query** (replacing server components/Prisma for data fetching)
- **shadcn/ui** + **Tailwind CSS v4** (carried over unchanged)
- **Cormorant Garamond** font for the new Cairn Summit wordmark
- **Josefin Sans** for the app UI (local TTF files in `public/fonts/`)
- **Tiptap** rich text editor (for Logs)
- **React Flow** (for Starfield facility network designer)
- **react-hook-form** + **zod** for forms

### Backend (`apps/api`)
- **AWS Lambda** — one handler per feature area
- **API Gateway HTTP API** — routes to Lambda functions
- **DynamoDB** — single-table design (table: `cairn-dev` / `cairn-prod`)
- **Cognito** — authentication (replacing Supabase Auth)
- **S3 + CloudFront** — static frontend hosting
- **SES** — email via nodemailer SMTP transport
- **S3** — media storage for Companion photos/videos (replacing Cloudflare R2)
- **SSM Parameter Store** — secrets (iCloud passwords, etc.)

### Infrastructure
- **Terraform** — all AWS infrastructure as code (`infrastructure/terraform/`)
- **GitHub Actions** — CI/CD (`deploy-web.yml`, `deploy-api.yml`, `deploy-infra.yml`)
- **Turborepo** — monorepo build orchestration

### AWS Account Structure
- **cairn-prod** — existing AWS account (management/root org account), color: Red
- **cairn-dev** — new member account under AWS Organizations, color: Green
- AWS CLI profiles: `cairn-prod` and `cairn-dev` (dev uses role assumption)

---

## Repository Structure

```
cairn/                              ← cairn-summit/cairn on GitHub
├── apps/
│   ├── web/                        ← Vite + React frontend
│   │   ├── src/
│   │   │   ├── routes/             ← React Router routes (replaces app/(platform)/)
│   │   │   │   ├── markers.tsx     ← ✅ MIGRATED
│   │   │   │   ├── markers/        ← feature components
│   │   │   │   │   ├── markers-client.tsx
│   │   │   │   │   ├── marker-form.tsx
│   │   │   │   │   ├── marker-list.tsx
│   │   │   │   │   └── markers-filter-bar.tsx
│   │   │   │   ├── waypoints.tsx   ← stub, needs migration
│   │   │   │   ├── logs.tsx        ← stub, needs migration
│   │   │   │   ├── guides.tsx      ← stub, needs migration
│   │   │   │   ├── trails.tsx      ← stub, needs migration
│   │   │   │   ├── provisions.tsx  ← stub, needs migration
│   │   │   │   ├── itinerary.tsx   ← stub, needs migration (READ-ONLY for now)
│   │   │   │   ├── signals.tsx     ← stub, needs migration
│   │   │   │   ├── manifest.tsx    ← stub, needs migration
│   │   │   │   ├── starfield.tsx   ← stub, needs migration
│   │   │   │   ├── settings.tsx    ← stub, needs migration
│   │   │   │   └── auth/login.tsx  ← stub, needs Cognito integration
│   │   │   ├── components/
│   │   │   │   ├── ui/             ← shadcn components (carry over unchanged)
│   │   │   │   ├── nav/            ← needs next/navigation → react-router-dom
│   │   │   │   ├── forms/          ← carry over, update action imports
│   │   │   │   ├── filters/        ← carry over
│   │   │   │   ├── search/         ← needs action imports updated
│   │   │   │   ├── auth/
│   │   │   │   │   └── protected-route.tsx
│   │   │   │   ├── theme/          ← carry over unchanged
│   │   │   │   ├── impersonation-banner.tsx ← DEFERRED (remove for now)
│   │   │   │   └── signal-notifier.tsx ← needs action imports updated
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts     ← placeholder, needs Cognito
│   │   │   │   ├── use-debounce.ts ← carry over unchanged
│   │   │   │   ├── use-filters.ts  ← needs next/navigation removed
│   │   │   │   ├── use-form-status.ts ← carry over unchanged
│   │   │   │   └── use-mobile.ts   ← carry over unchanged
│   │   │   ├── contexts/
│   │   │   │   └── terminology-context.tsx ← carry over unchanged
│   │   │   ├── lib/
│   │   │   │   ├── api/            ← API fetch functions per feature
│   │   │   │   │   └── markers.ts  ← ✅ CREATED
│   │   │   │   ├── utils.ts        ← includes extractId() utility
│   │   │   │   ├── color.ts        ← carry over unchanged
│   │   │   │   ├── terminology.ts  ← carry over unchanged
│   │   │   │   ├── marker-groups.ts ← carry over unchanged
│   │   │   │   ├── filters.ts      ← carry over unchanged
│   │   │   │   ├── format-age.ts   ← carry over unchanged
│   │   │   │   ├── recurrence.ts   ← carry over unchanged
│   │   │   │   ├── luvi.ts         ← carry over UNCHANGED (custom calendar)
│   │   │   │   ├── encrypt.ts      ← carry over unchanged
│   │   │   │   ├── ical.ts         ← needs next fetch options removed
│   │   │   │   ├── import-stones.ts ← carry over unchanged
│   │   │   │   ├── mailer.ts       ← updated to use SES SMTP
│   │   │   │   ├── schemas/        ← carry over unchanged
│   │   │   │   ├── r2.ts           ← rename to s3.ts, update SDK
│   │   │   │   └── r2-companions.ts ← rename to s3-companions.ts, update SDK
│   │   │   ├── globals.css         ← moved from src/app/globals.css, UNCHANGED
│   │   │   ├── App.tsx             ← React Router root with all routes
│   │   │   └── main.tsx            ← Vite entry point
│   │   ├── public/
│   │   │   └── fonts/              ← Josefin Sans TTF files
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tailwind.config.ts      ← not needed, Tailwind v4 CSS-first
│   │   ├── components.json         ← shadcn config (rsc: false)
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   │
│   └── api/                        ← Lambda functions
│       ├── functions/
│       │   ├── waypoints/
│       │   ├── logs/
│       │   ├── guides/
│       │   ├── stones/
│       │   ├── trails/
│       │   ├── markers/
│       │   ├── provisions/
│       │   ├── stops/
│       │   ├── signals/
│       │   ├── manifest/
│       │   ├── starfield/
│       │   └── shared/
│       │       ├── db.ts           ← DynamoDB DocumentClient
│       │       ├── auth.ts         ← Cognito JWT validation
│       │       └── response.ts     ← HTTP response helpers
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── types/                      ← shared TypeScript interfaces
│   │   ├── handler.ts                ← all entity types
│   │   ├── tsconfig.json
│   │   └── package.json            ← name: @cairn/types
│   └── config/                     ← shared tsconfig
│       ├── tsconfig.json           ← base config
│       ├── tsconfig.web.json       ← Vite/React config
│       ├── tsconfig.lambda.json    ← Lambda/Node config
│       └── package.json            ← name: @cairn/config
│
├── infrastructure/
│   └── terraform/                  ← AWS infrastructure as code
│       ├── main.tf                 ← provider + S3 backend config
│       ├── variables.tf
│       ├── outputs.tf
│       ├── dynamodb.tf
│       ├── cognito.tf
│       ├── lambda.tf
│       ├── api-gateway.tf
│       ├── s3.tf
│       ├── cloudfront.tf
│       ├── iam.tf
│       └── terraform.tfvars.example
│
├── scripts/
│   └── migrate.ts                  ← Supabase → DynamoDB migration script
│
├── .github/
│   └── workflows/
│       ├── deploy-web.yml          ← triggers on apps/web/** changes
│       ├── deploy-api.yml          ← triggers on apps/api/** changes
│       └── deploy-infra.yml        ← triggers on infrastructure/** changes
│
├── tsconfig.base.json              ← root shared TypeScript base
├── turbo.json                      ← Turborepo config
├── package.json                    ← root workspace (npm workspaces)
├── eslint.config.mjs               ← root ESLint config
└── CLAUDE.md                       ← this file
```

---

## DynamoDB Single-Table Design

**Table names:** `cairn-dev` (dev) / `cairn-prod` (prod)

### Key Pattern Reference

```
PK                    SK                          Entity
USER#<id>             PROFILE                     Wayfarer profile + Origins
USER#<id>             SETTINGS                    All settings collapsed
USER#<id>             WAYPOINT#<id>               Waypoint
USER#<id>             LOG#<id>                    Log
USER#<id>             TRAIL#<id>                  Trail
USER#<id>             MARKER#<id>                 Marker definition
USER#<id>             GUIDE#<id>                  Guide (flashcard deck)
USER#<id>             STONE#<guideId>#<id>        Stone (flashcard)
USER#<id>             STOP#<id>                   Calendar stop/event
USER#<id>             SIGNAL#<id>                 Signal (contact message)
USER#<id>             SIGNAL#<id>#REPLY#<id>      Signal reply
USER#<id>             EXPEDITION#<id>             Manifest - work experience
USER#<id>             TRAINING#<id>               Manifest - education
USER#<id>             GEAR#<id>                   Manifest - skill
USER#<id>             LANDMARK#<id>               Manifest - project
USER#<id>             SUMMIT#<id>                 Manifest - achievement
USER#<id>             PATHFINDING#<id>            Manifest - volunteering
USER#<id>             COMPANION#<id>              Manifest - pet
USER#<id>             PROVISION#<id>              Subscription/provision
USER#<id>             EXPENSE#<id>                Expense
USER#<id>             BUDGET#<markerId>#<m>#<y>   Budget
USER#<id>             SF#NETWORK#<id>             Starfield network
USER#<id>             SF#FACILITY#<id>            Starfield facility
SF#RESOURCE           RESOURCE#<id>               Starfield resource (global)
```

### Key Design Decisions

1. **Markers are denormalized** — stored as embedded arrays on each item, not junction tables. When a marker is renamed/recolored, a batch Lambda updates all affected items.

2. **Settings collapsed** — all 7 settings models from Prisma become one `SETTINGS` item per user.

3. **Guides/Stones use hierarchical SK** — `STONE#<guideId>#<stoneId>` so all stones for a guide can be fetched with `SK begins_with STONE#<guideId>`.

4. **Signals use parent-child SK** — `SIGNAL#<id>#REPLY#<replyId>` so a signal and all its replies fetch in one query.

5. **Auth stays in Cognito** — no auth tables in DynamoDB. Lambda validates Cognito JWT and extracts user ID.

6. **Starfield resources are global** — `PK: SF#RESOURCE` not user-scoped. Shared reference data.

7. **`id` is extracted from `sk`** — use `extractId(sk)` utility in `src/lib/utils.ts` to get the bare ID from a sort key. Never add `id` to the shared types.

---

## Migration Patterns

### Next.js → React Router Import Swaps

```typescript
// next/navigation replacements
import { useRouter } from 'next/navigation'
→ import { useNavigate } from 'react-router-dom'
   const navigate = useNavigate()
   router.push('/path') → navigate('/path')

import { useSearchParams } from 'next/navigation'
→ import { useSearchParams } from 'react-router-dom'
   const [searchParams, setSearchParams] = useSearchParams()  // note: tuple destructure

import { usePathname } from 'next/navigation'
→ import { useLocation } from 'react-router-dom'
   const location = useLocation()
   pathname → location.pathname

import { redirect } from 'next/navigation'
→ import { Navigate } from 'react-router-dom'
   redirect('/login') → return <Navigate to="/login" replace />

import Link from 'next/link'
→ import { Link } from 'react-router-dom'
```

### Server Actions → API Calls

All `@/actions/*` imports are replaced with `@/lib/api/*` fetch functions.

```typescript
// Old pattern
import { saveMarker } from '@/actions/waypoints'
await saveMarker({ name, color })

// New pattern
import { createMarker, updateMarker } from '@/lib/api/markers'
await createMarker({ name, color })
```

### Page Data Fetching Pattern

```typescript
// Old Next.js page (server component)
export default async function MarkersPage() {
  const session = await auth()
  const markers = await prisma.marker.findMany(...)
  return <MarkersClient markers={markers} />
}

// New Vite route (client component)
export default function Markers() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery<Marker[]>({
    queryKey: ['markers', user?.id],
    queryFn: getMarkers,
    enabled: !!user
  })
  const markers = (data ?? []).map(m => ({
    id: extractId(m.sk),
    name: m.name,
    color: m.color,
    icon: m.icon ?? null
  }))
  if (isLoading) return <LoadingSpinner />
  return <MarkersClient markers={markers} />
}
```

### router.refresh() → TanStack Query Invalidation

```typescript
// Old
router.refresh()

// New — in the mutation handler
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['markers'] })
```

---

## API Layer Patterns

### Lambda Response Helpers (`apps/api/functions/shared/response.ts`)

```typescript
ok(data)           // 200
created(data)      // 201
noContent()        // 204
badRequest(msg)    // 400
unauthorized(msg)  // 401
forbidden(msg)     // 403
notFound(msg)      // 404
conflict(msg)      // 409
serverError(msg)   // 500
toApiGatewayResponse(response) // wraps for API Gateway
```

### DynamoDB Client (`apps/api/functions/shared/db.ts`)

```typescript
import { dynamo, TABLE_NAME } from '../shared/db'
// dynamo is DynamoDBDocumentClient — handles marshalling automatically
// TABLE_NAME comes from DYNAMODB_TABLE env var
```

### Auth Headers (placeholder until Cognito is wired up)

```typescript
// src/lib/api/[feature].ts
async function getAuthHeaders(): Promise<Record<string, string>> {
  // TODO: replace with Cognito token
  return {}
}
```

---

## Features Status

| Feature | Frontend Migration | Lambda | Notes |
|---|---|---|---|
| Markers | ✅ Migrated | ⬜ Not started | First completed migration |
| Waypoints | ⬜ Stub | ⬜ Not started | Has dynamic [id] route |
| Logs | ⬜ Stub | ⬜ Not started | Uses Tiptap editor |
| Guides | ⬜ Stub | ⬜ Not started | Has [guideId] dynamic route |
| Trails | ⬜ Stub | ⬜ Not started | |
| Provisions | ⬜ Stub | ⬜ Not started | Includes Expenses + Budgets |
| Itinerary | ⬜ Stub | ⬜ Not started | READ-ONLY first pass |
| Signals | ⬜ Stub | ⬜ Not started | Contact form inbox |
| Manifest | ⬜ Stub | ⬜ Not started | Powers levismith.us |
| Starfield | ⬜ Stub | ⬜ Not started | React Flow designer |
| Settings | ⬜ Stub | ⬜ Not started | All settings in one DDB item |
| Auth/Login | ⬜ Stub | ⬜ Not started | Needs Cognito integration |

---

## Deferred Features

- **Impersonation** — admin can view app as another user. Deferred, requires Cognito admin APIs.
- **DoorDash tracker** — removed entirely from new platform.
- **Email (IMAP)** — removed, CachedEmail model dropped.

---

## Luvi Calendar System

`src/lib/luvi.ts` — a custom 14-month, 26-days-per-month calendar system co-developed by Levi Smith and Luke Lindeman. Integrated into the Itinerary feature. The file is pure computation with zero framework dependencies — carry over completely unchanged. Source: https://github.com/lsmith2-edison/luvi

---

## Starfield Feature

A Starfield game resource and facility network tracker. Key design decisions:

- **Resources** — global reference data (`PK: SF#RESOURCE`), not user-scoped. Have tiers (0=mined, 1-3=manufactured) and ingredient arrays.
- **Networks** — user-owned groupings of facilities (`USER#<id> NETWORK#<id>`).
- **Facilities** — nodes in a directed tree graph. Parent-child via `parentId`. Position stored for React Flow canvas persistence.
- **Resource flow** — each facility resource tracks `onsite` (mined/manufactured locally) or `fromFacilityId` (transferred from subfacility) plus optional `relay` metadata for cross-system transfers.
- **UI** — React Flow canvas with drag-and-drop, real-time dependency validation, snowcap-styled mountain metaphor in the logo.
- **Self-referential recipe relationships** from the old Prisma schema are replaced with flat `ingredients: string[]` arrays.

---

## Environment Variables

### `apps/web` (Vite — prefix with `VITE_`)
```
VITE_API_URL          ← API Gateway base URL
VITE_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID
VITE_AWS_REGION
```

### `apps/api` (Lambda env vars via Terraform)
```
DYNAMODB_TABLE        ← cairn-dev or cairn-prod
AWS_REGION            ← us-east-1
COGNITO_USER_POOL_ID
SES_SMTP_USER
SES_SMTP_PASSWORD
SUPABASE_POOLED_URL   ← only needed during migration script
```

---

## Key Utilities

### `extractId(sk: string): string`
Located in `src/lib/utils.ts`. Extracts bare ID from DynamoDB sort key.
```typescript
extractId('MARKER#abc123') // → 'abc123'
extractId('STONE#guide1#stone2') // → 'stone2'
```

### `cn(...inputs: ClassValue[]): string`
Located in `src/lib/utils.ts`. Standard shadcn class merging utility.

---

## Domains

- `cairn.ing` — main app (prod)
- `dev.cairn.ing` — dev environment
- `levismith.us` — Manifest/resume (powered by Cairn)
- Registrar: GoDaddy (staying there)
- DNS: Route 53 (nameserver switch, not full transfer)

---

## GitHub

- **Org:** `cairn-summit`
- **Repo:** `cairn-summit/cairn`
- **Team:** Rangers (maintainers)
- **Legacy:** `levi-smith17/cairn` (original Next.js app, preserved on Vercel)
- Branch protection on `main` — all changes via PR
- Feature branches → develop → main

---

## Current Migration Status

Working through TypeScript errors in `apps/web`. Approach:
1. Exclude `src/app/` from tsconfig (old Next.js structure, migrating feature by feature)
2. Fix Next.js imports in shared components
3. Migrate one feature at a time: move components to `src/routes/<feature>/`, update imports, create `src/lib/api/<feature>.ts`
4. Markers is the first completed migration — use it as the template

### Remaining TypeScript issues to resolve
- `next/navigation` imports in nav components and hooks
- `next/link` in footer and public header
- `@/actions/*` imports in signal-notifier, command-palette, planet-picker
- `impersonation-banner.tsx` — remove entirely (deferred feature)
- `ical.ts` — remove `next:` fetch option
- Platform layout component needs to be created
- `use-filters.ts` needs `next/navigation` removed