/**
 * Migration: Copy Headwaters + Starfield data from one DynamoDB table to another.
 *
 * Items copied:
 *   Headwaters  USER#<id> / KIN#<id>
 *   Starfield   USER#<id> / SF#NETWORK#<id>
 *               USER#<id> / SF#FACILITY#<id>
 *               SF#RESOURCE / RESOURCE#<id>   (global, no user remapping)
 *
 * Required env vars:
 *   SOURCE_TABLE      Source DynamoDB table name  (e.g. cairn-dev)
 *   TARGET_TABLE      Target DynamoDB table name  (e.g. cairn-prod)
 *   DEV_USER_PK       User pk in source table     (e.g. USER#abc-123)
 *   PROD_USER_PK      User pk in target table     (e.g. USER#xyz-789)
 *   AWS_REGION        (default: us-east-1)
 *
 * AWS credentials:
 *   The script uses your default credential chain. The simplest approach is to
 *   run it twice — once per account — pointing at each table, OR use a cross-
 *   account role. The recommended approach for this repo is:
 *
 *     1. Export prod credentials first (AWS_ACCESS_KEY_ID / SECRET / SESSION_TOKEN),
 *        run with TARGET_TABLE=cairn-prod to write prod items.
 *     2. Switch to dev credentials, run with SOURCE_TABLE=cairn-dev to read.
 *
 *   Easier: pass AWS profiles via AWS_PROFILE for each table by running the
 *   script once with source profile, piping items to JSON, then running again
 *   with target profile to write. The script supports this via --dry-run mode
 *   (set DRY_RUN=1 to print items instead of writing).
 *
 * Recommended single-command approach (both profiles available):
 *   SOURCE_TABLE=cairn-dev \
 *   TARGET_TABLE=cairn-prod \
 *   DEV_USER_PK="USER#<dev-cognito-sub>" \
 *   PROD_USER_PK="USER#<prod-cognito-sub>" \
 *   AWS_PROFILE=cairn-dev \       ← used for SOURCE reads
 *   npx ts-node scripts/migrate-headwaters-starfield.ts
 *
 *   (The script builds two separate DynamoDB clients with explicit profile
 *    overrides; set SOURCE_PROFILE and TARGET_PROFILE to use different profiles.)
 *
 * The script is idempotent — re-running overwrites existing items.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
    DynamoDBDocumentClient,
    QueryCommand,
    ScanCommand,
    BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SOURCE_TABLE  = process.env.SOURCE_TABLE  ?? 'cairn-dev'
const TARGET_TABLE  = process.env.TARGET_TABLE  ?? 'cairn-prod'
const DEV_USER_PK   = process.env.DEV_USER_PK
const PROD_USER_PK  = process.env.PROD_USER_PK
const REGION        = process.env.AWS_REGION    ?? 'us-east-1'
const DRY_RUN       = process.env.DRY_RUN === '1'
const SOURCE_PROFILE = process.env.SOURCE_PROFILE
const TARGET_PROFILE = process.env.TARGET_PROFILE

if (!DEV_USER_PK || !PROD_USER_PK) {
  console.error('DEV_USER_PK and PROD_USER_PK are required.')
  console.error('  DEV_USER_PK  = the pk value in the source table  (e.g. USER#abc-123)')
  console.error('  PROD_USER_PK = the pk value in the target table  (e.g. USER#xyz-789)')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
function makeClient(profile?: string) {
  const config: ConstructorParameters<typeof DynamoDBClient>[0] = { region: REGION }
  if (profile) config.credentials = fromIni({ profile })
  return DynamoDBDocumentClient.from(
    new DynamoDBClient(config),
    { marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false } }
  )
}

const sourceDynamo = makeClient(SOURCE_PROFILE)
const targetDynamo = makeClient(TARGET_PROFILE)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function queryAll(table: string, pk: string, skPrefix: string): Promise<any[]> {
  const items: any[] = []
  let lastKey: Record<string, any> | undefined

  do {
    const res = await sourceDynamo.send(new QueryCommand({
      TableName: table,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': pk, ':prefix': skPrefix },
      ExclusiveStartKey: lastKey,
    }))
    items.push(...(res.Items ?? []))
    lastKey = res.LastEvaluatedKey
  } while (lastKey)

  return items
}

async function scanAll(table: string, pk: string, skPrefix: string): Promise<any[]> {
  const items: any[] = []
  let lastKey: Record<string, any> | undefined

  do {
    const res = await sourceDynamo.send(new ScanCommand({
      TableName: table,
      FilterExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': pk, ':prefix': skPrefix },
      ExclusiveStartKey: lastKey,
    }))
    items.push(...(res.Items ?? []))
    lastKey = res.LastEvaluatedKey
  } while (lastKey)

  return items
}

async function batchWrite(items: Record<string, unknown>[]) {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25)
    let pending: any[] = chunk.map(Item => ({
      PutRequest: { Item },
    }))
    let attempt = 0

    while (pending.length > 0) {
      if (attempt > 0) {
        const delay = Math.min(200 * 2 ** (attempt - 1), 5000)
        await new Promise(r => setTimeout(r, delay))
      }
      const res = await targetDynamo.send(new BatchWriteCommand({
        RequestItems: { [TARGET_TABLE]: pending },
      }))
      const unprocessed = res.UnprocessedItems?.[TARGET_TABLE] ?? []
      pending = unprocessed
      attempt++
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Source: ${SOURCE_TABLE}  (${SOURCE_PROFILE ?? 'default profile'})`)
  console.log(`Target: ${TARGET_TABLE}  (${TARGET_PROFILE ?? 'default profile'})`)
  console.log(`Dev user pk:  ${DEV_USER_PK}`)
  console.log(`Prod user pk: ${PROD_USER_PK}`)
  if (DRY_RUN) console.log('DRY RUN — items will be printed, not written')
  console.log()

  // ── Headwaters (KIN) ──────────────────────────────────────────────────────
  console.log('Fetching Headwaters (KIN) items…')
  const kinItems = await queryAll(SOURCE_TABLE, DEV_USER_PK!, 'KIN#')
  console.log(`  Found ${kinItems.length} KIN items`)

  // ── Starfield networks ────────────────────────────────────────────────────
  console.log('Fetching Starfield network items…')
  const networkItems = await queryAll(SOURCE_TABLE, DEV_USER_PK!, 'SF#NETWORK#')
  console.log(`  Found ${networkItems.length} SF#NETWORK items`)

  // ── Starfield facilities ──────────────────────────────────────────────────
  console.log('Fetching Starfield facility items…')
  const facilityItems = await queryAll(SOURCE_TABLE, DEV_USER_PK!, 'SF#FACILITY#')
  console.log(`  Found ${facilityItems.length} SF#FACILITY items`)

  // ── Starfield global resources (SF#RESOURCE pk, no user remapping) ────────
  console.log('Fetching Starfield global resource items…')
  const resourceItems = await scanAll(SOURCE_TABLE, 'SF#RESOURCE', 'RESOURCE#')
  console.log(`  Found ${resourceItems.length} SF#RESOURCE items`)

  console.log()

  // ── Remap pk for user-scoped items ────────────────────────────────────────
  const remapPk = (item: any) => ({
    ...item,
    pk: item.pk === DEV_USER_PK ? PROD_USER_PK : item.pk,
  })

  const allItems = [
    ...kinItems.map(remapPk),
    ...networkItems.map(remapPk),
    ...facilityItems.map(remapPk),
    ...resourceItems, // global — pk stays SF#RESOURCE
  ]

  console.log(`Total items to write: ${allItems.length}`)

  if (DRY_RUN) {
    console.log(JSON.stringify(allItems, null, 2))
    return
  }

  if (allItems.length === 0) {
    console.log('Nothing to write.')
    return
  }

  console.log(`Writing to ${TARGET_TABLE}…`)
  await batchWrite(allItems)
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
