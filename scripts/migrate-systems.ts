/**
 * One-time migration: scan all SF#FACILITY items across all users and create
 * SF#SYSTEM / SYSTEM#<id> records from every unique system/planet combination.
 *
 * Run with:
 *   DYNAMODB_TABLE=cairn-dev AWS_PROFILE=cairn-dev npx ts-node scripts/migrate-systems.ts
 *
 * Safe to re-run — uses ConditionExpression to skip existing records.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const TABLE_NAME = process.env.DYNAMODB_TABLE ?? 'cairn-dev'
const REGION = process.env.AWS_REGION ?? 'us-east-1'

const client = new DynamoDBClient({ region: REGION })
const dynamo = DynamoDBDocumentClient.from(client)

async function scanAll(filterExpression: string, expressionValues: Record<string, string>) {
  const items: any[] = []
  let lastKey: Record<string, any> | undefined = undefined
  do {
    const res = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ExclusiveStartKey: lastKey as Record<string, any> | undefined,
    }))
    items.push(...(res.Items ?? []))
    lastKey = res.LastEvaluatedKey as Record<string, any> | undefined
  } while (lastKey)
  return items
}

async function main() {
  console.log(`Scanning table: ${TABLE_NAME}`)

  const facilities = await scanAll(
    'begins_with(sk, :prefix)',
    { ':prefix': 'SF#FACILITY#' }
  )

  console.log(`Found ${facilities.length} facilities`)

  // Collect unique system → Set<planet> mappings
  const systemMap = new Map<string, Set<string>>()

  function addPlanet(system: string, planet: string) {
    if (!system || !planet) return
    if (!systemMap.has(system)) systemMap.set(system, new Set())
    systemMap.get(system)!.add(planet)
  }

  facilities.forEach((facility: any) => {
    addPlanet(facility.system, facility.planet)
    const resourcesObj = facility.resources ?? {}
    const resources: any[] = Array.isArray(resourcesObj)
      ? resourcesObj
      : Object.values(resourcesObj)
    resources.forEach((resource: any) => {
      if (resource.fromSystem && resource.fromPlanet && !resource.fromOutpostId) {
        addPlanet(resource.fromSystem, resource.fromPlanet)
      }
      if (resource.relay?.system && resource.relay?.planet) {
        addPlanet(resource.relay.system, resource.relay.planet)
      }
    })
  })

  console.log(`Found ${systemMap.size} unique systems`)

  let created = 0
  let skipped = 0

  for (const [systemName, planetSet] of Array.from(systemMap.entries())) {
    const systemId = systemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const planets = Array.from(planetSet).map(name => ({
      id: randomUUID(),
      name,
    }))

    try {
      await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: 'SF#SYSTEM',
          sk: `SYSTEM#${systemId}`,
          name: systemName,
          planets,
          createdAt: new Date().toISOString(),
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      }))
      console.log(`  ✓ ${systemName} (${planets.length} planets)`)
      created++
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.log(`  ~ ${systemName} (already exists, skipped)`)
        skipped++
      } else {
        console.error(`  ✗ ${systemName}: ${err.message}`)
      }
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
