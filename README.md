# Cairn (Summit)

> *A cairn is a stack of stones left by travelers to mark the path for those who follow. This is yours.*

Cairn is a comprehensive personal productivity and life management platform built around a hiking metaphor. Every feature, every data type, and every interaction is named for the language of the trail — because the best systems feel like they were made for the journey, not just the destination.

Now that the platform has reached the Cairn Summit, the journey has ascended from local trails to the vast expanse of the AWS Cloud. By moving the infrastructure into the availability and reliability of serverless architecture, the platform no longer just marks the path—it overlooks the entire horizon. This summit iteration ensures that Waypoints, Logs, and Provisions are anchored in the high-altitude performance of the cloud, providing a stable, scalable peak from which to manage one's digital life.

---

## What Cairn Does

Cairn consolidates the tools a person actually needs into a single, cohesive platform — organized around a consistent metaphor that makes the system feel intentional rather than assembled.

| Feature | Cairn Name | Description |
|---|---|---|
| Bookmarks | **Waypoints** | Save and organize links and references |
| Notes | **Logs** | Personal note-taking and journaling |
| Finances | **Provisions** | Personal finance tracking and management |
| Flashcards | **Guides** | Study and review system (cards called Stones) |
| Folders | **Trails** | Hierarchical organization for all content types |
| Tags | **Markers** | Cross-cutting categorization and labeling |
| Calendar | **Itinerary** | Unified view integrating multiple external calendar sources |
| Resume | **Manifest** | A dynamic, living resume builder |
| Messages | **Signals** | Inbound contact messages and reply threads |

---

## Tech Stack

### Frontend
- **[Vite](https://vitejs.dev/)** + **[React](https://react.dev/)** — replaces Next.js App Router
- **[React Router v7](https://reactrouter.com/)** — client-side routing
- **[TanStack Query](https://tanstack.com/query)** — data fetching and cache management
- **[shadcn/ui](https://ui.shadcn.com/)** + **[Tailwind CSS v4](https://tailwindcss.com/)** — UI components and styling
- **[Tiptap](https://tiptap.dev/)** — rich text editor for Logs
- **[React Flow](https://reactflow.dev/)** — node graph canvas for Starfield
- **[react-hook-form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** — form validation

### Backend
- **[AWS Lambda](https://aws.amazon.com/lambda/)** — serverless function handlers, one per feature area
- **[API Gateway HTTP API](https://aws.amazon.com/api-gateway/)** — routes requests to Lambda functions
- **[DynamoDB](https://aws.amazon.com/dynamodb/)** — single-table design (`cairn-dev` / `cairn-prod`)
- **[Cognito](https://aws.amazon.com/cognito/)** — authentication and user management
- **[S3](https://aws.amazon.com/s3/) + [CloudFront](https://aws.amazon.com/cloudfront/)** — static frontend hosting and CDN
- **[SES](https://aws.amazon.com/ses/)** — transactional email via SMTP

### Infrastructure
- **[Terraform](https://www.terraform.io/)** — all AWS infrastructure as code
- **[Turborepo](https://turbo.build/)** — monorepo build orchestration
- **[GitHub Actions](https://github.com/features/actions)** — CI/CD for web, API, and infrastructure

---

## Monorepo Structure

```
cairn/
├── apps/
│   ├── web/          # Vite + React frontend
│   └── api/          # AWS Lambda functions
├── packages/
│   ├── types/        # Shared TypeScript interfaces (@cairn/types)
│   └── config/       # Shared tsconfig base (@cairn/config)
└── infrastructure/
    └── terraform/    # AWS infrastructure as code
```

---

## The Manifest

The Manifest is Cairn's resume builder — a living, dynamic profile for a Wayfarer (user) that pulls together professional experience, skills, projects, education, and community involvement into a single shareable profile. The Manifest powers [levismith.us](https://levismith.us).

---

## The Metaphor

Every feature name is drawn from the language of hiking and wayfinding:

- A **Waypoint** is a landmark on a map — a place worth remembering
- A **Log** is the record a traveler keeps of their journey
- **Provisions** are what you carry to sustain yourself
- A **Guide** helps you learn the terrain
- A **Trail** is the path that connects waypoints
- A **Marker** helps others (and yourself) find the way
- An **Itinerary** is the plan for where you're going
- A **Signal** is a message sent from the trail
- A **Manifest** is the full account of who you are and what you carry

---

## Getting Started

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. You'll need a `.env` file in `apps/web/` with the following variables:

```
VITE_API_URL=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_AWS_REGION=
```

---

## Domains

| Environment | Domain |
|---|---|
| Production | [cairn.ing](https://cairn.ing) |
| Development | [dev.cairn.ing](https://dev.cairn.ing) |
| Manifest | [levismith.us](https://levismith.us) |

---

## Project Status

Cairn is actively developed and maintained. It is a personal project and not open for contributions at this time, but feel free to explore the codebase, ask questions, or reach out via [levismith.us](https://cairn.ing/manifest/levi/contact).

---

*Built by [Levi Smith](https://levismith.us) with [Claude Code](https://www.anthropic.com/claude-code)*
