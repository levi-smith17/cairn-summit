/**
 * One-time fix: updates companion media S3 keys from the old userId to the correct one.
 *
 * During migration, companion media was uploaded to S3 under the wrong userId prefix.
 * This script:
 *   1. Copies each object from companions/{OLD_USER_ID}/* to companions/{NEW_USER_ID}/*
 *   2. Deletes the old objects
 *   3. Updates every COMPANION# DynamoDB item's media[].key fields to use the new prefix
 *
 * Required env vars:
 *   OLD_USER_ID            The userId currently in S3 (the wrong one from the old platform)
 *   NEW_USER_ID            The correct Cognito sub
 *   DYNAMODB_TABLE         e.g. cairn-dev
 *   S3_PUBLIC_MEDIA_BUCKET e.g. cairn-public-media
 *   AWS_REGION             e.g. us-east-1
 *   AWS_PROFILE            e.g. cairn-dev
 *
 * Run from repo root:
 *   OLD_USER_ID="old-uuid-here" \
 *   NEW_USER_ID="cognito-sub-here" \
 *   DYNAMODB_TABLE=cairn-dev \
 *   S3_PUBLIC_MEDIA_BUCKET=cairn-public-media \
 *   AWS_REGION=us-east-1 \
 *   AWS_PROFILE=cairn-dev \
 *   npx ts-node scripts/fix-companion-media-paths.ts
 */

import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'

const OLD_USER_ID = process.env.OLD_USER_ID
const NEW_USER_ID = process.env.NEW_USER_ID
const TABLE_NAME   = process.env.DYNAMODB_TABLE
const BUCKET       = process.env.S3_PUBLIC_MEDIA_BUCKET
const REGION       = process.env.AWS_REGION ?? 'us-east-1'
const PROFILE      = process.env.AWS_PROFILE

if (!OLD_USER_ID || !NEW_USER_ID || !TABLE_NAME || !BUCKET) {
    console.error('Missing required env vars: OLD_USER_ID, NEW_USER_ID, DYNAMODB_TABLE, S3_PUBLIC_MEDIA_BUCKET')
    process.exit(1)
}

const credentials = PROFILE ? fromIni({ profile: PROFILE }) : undefined
const s3 = new S3Client({ region: REGION, credentials })
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION, credentials }))

const OLD_PREFIX = `companions/${OLD_USER_ID}/`
const NEW_PREFIX = `companions/${NEW_USER_ID}/`

async function listAllObjects(): Promise<string[]> {
    const keys: string[] = []
    let token: string | undefined

    do {
        const res = await s3.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: OLD_PREFIX,
            ContinuationToken: token,
        }))
        for (const obj of res.Contents ?? []) {
            if (obj.Key) keys.push(obj.Key)
        }
        token = res.NextContinuationToken
    } while (token)

    return keys
}

async function migrateS3(keys: string[]) {
    console.log(`\nS3: copying ${keys.length} objects → ${NEW_PREFIX}`)

    for (const oldKey of keys) {
        const filename = oldKey.slice(OLD_PREFIX.length)
        const newKey   = `${NEW_PREFIX}${filename}`

        await s3.send(new CopyObjectCommand({
            Bucket:     BUCKET,
            CopySource: `${BUCKET}/${oldKey}`,
            Key:        newKey,
        }))
        console.log(`  copied  ${oldKey} → ${newKey}`)
    }

    // Bulk delete old objects (max 1000 per request, well within our 27)
    await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.map(Key => ({ Key })) },
    }))
    console.log(`  deleted ${keys.length} old objects`)
}

async function migrateDynamo() {
    const pk = `USER#${NEW_USER_ID}`
    console.log(`\nDynamoDB: querying companions for ${pk}`)

    const res = await dynamo.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': pk, ':prefix': 'COMPANION#' },
    }))

    const companions = res.Items ?? []
    console.log(`  found ${companions.length} companion items`)

    for (const item of companions) {
        const media: Array<{ key: string; [k: string]: unknown }> = item.media ?? []
        if (media.length === 0) continue

        const updated = media.map(m => ({
            ...m,
            key: m.key.startsWith(OLD_PREFIX) ? m.key.replace(OLD_PREFIX, NEW_PREFIX) : m.key,
        }))

        const changed = updated.some((m, i) => m.key !== media[i].key)
        if (!changed) {
            console.log(`  skipped ${item.sk} (keys already correct)`)
            continue
        }

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: item.sk },
            UpdateExpression: 'SET #media = :media',
            ExpressionAttributeNames: { '#media': 'media' },
            ExpressionAttributeValues: { ':media': updated },
        }))
        console.log(`  updated ${item.sk} (${updated.length} media item${updated.length !== 1 ? 's' : ''})`)
    }
}

async function main() {
    console.log(`Fixing companion media paths`)
    console.log(`  old prefix: ${OLD_PREFIX}`)
    console.log(`  new prefix: ${NEW_PREFIX}`)
    console.log(`  bucket:     ${BUCKET}`)
    console.log(`  table:      ${TABLE_NAME}`)

    const keys = await listAllObjects()
    if (keys.length === 0) {
        console.log('\nNo objects found under old prefix — nothing to do.')
        return
    }

    console.log(`\nFound ${keys.length} S3 objects:`)
    keys.forEach(k => console.log(`  ${k}`))

    await migrateS3(keys)
    await migrateDynamo()

    console.log('\nDone.')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
