/**
 * One-time migration: convert Provision/Expense categories → Markers
 *
 * Run ORDER:
 *   1. Apply Phase 1 schema (markerId? added to Budget)
 *   2. npx prisma migrate dev --name provisions-budget-marker-id
 *   3. npx tsx scripts/migrate-provisions-to-markers.ts   ← this script
 *   4. Apply Phase 2 schema (remove category columns, markerId required)
 *   5. npx prisma migrate dev --name provisions-remove-category
 *
 * The script is idempotent — safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('── Provisions → Markers migration ──')

  // 1. Collect all distinct wayfarerId + category combos across all three models
  const [expenses, provisions, budgets] = await Promise.all([
    prisma.expense.findMany({ select: { id: true, wayfarerId: true, category: true } }),
    prisma.provision.findMany({ select: { id: true, wayfarerId: true, category: true } }),
    prisma.budget.findMany({ select: { id: true, wayfarerId: true, category: true } }),
  ])

  const seen = new Set<string>()
  const combos: { wayfarerId: string; category: string }[] = []
  for (const item of [...expenses, ...provisions, ...budgets]) {
    if (!item.category) continue
    const key = `${item.wayfarerId}:${item.category}`
    if (!seen.has(key)) { seen.add(key); combos.push({ wayfarerId: item.wayfarerId, category: item.category }) }
  }

  console.log(`Found ${combos.length} unique wayfarer+category combinations`)

  // 2. Create or find a Marker named "Provisions/{category}" for each combo
  const markerMap = new Map<string, string>() // `wayfarerId:category` → markerId

  for (const { wayfarerId, category } of combos) {
    const markerName = `Provisions/${category}`
    const existing = await prisma.marker.findFirst({ where: { wayfarerId, name: markerName } })
    const marker = existing ?? await prisma.marker.create({
      data: { name: markerName, color: '#64748b', wayfarerId },
    })
    markerMap.set(`${wayfarerId}:${category}`, marker.id)
    console.log(`  ${existing ? 'Found' : 'Created'} marker: ${markerName}`)
  }

  // 3. Assign marker to each expense (upsert — idempotent)
  let expenseCount = 0
  for (const expense of expenses) {
    if (!expense.category) continue
    const markerId = markerMap.get(`${expense.wayfarerId}:${expense.category}`)
    if (!markerId) continue
    await prisma.markersOnExpenses.upsert({
      where: { expenseId_markerId: { expenseId: expense.id, markerId } },
      update: {},
      create: { expenseId: expense.id, markerId },
    })
    expenseCount++
  }
  console.log(`  Assigned markers to ${expenseCount} expenses`)

  // 4. Assign marker to each provision (upsert — idempotent)
  let provisionCount = 0
  for (const provision of provisions) {
    if (!provision.category) continue
    const markerId = markerMap.get(`${provision.wayfarerId}:${provision.category}`)
    if (!markerId) continue
    await prisma.markersOnProvisions.upsert({
      where: { provisionId_markerId: { provisionId: provision.id, markerId } },
      update: {},
      create: { provisionId: provision.id, markerId },
    })
    provisionCount++
  }
  console.log(`  Assigned markers to ${provisionCount} provisions`)

  // 5. Update each budget with its markerId (Phase 1 added markerId? column)
  let budgetCount = 0
  for (const budget of budgets) {
    if (!budget.category) continue
    const markerId = markerMap.get(`${budget.wayfarerId}:${budget.category}`)
    if (!markerId) continue
    // Use updateMany to avoid type error if Prisma types haven't regenerated yet
    await (prisma.budget as any).update({
      where: { id: budget.id },
      data: { markerId },
    })
    budgetCount++
  }
  console.log(`  Updated ${budgetCount} budgets with markerId`)

  console.log('✓ Migration complete. Now apply Phase 2 schema and run prisma migrate dev.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
