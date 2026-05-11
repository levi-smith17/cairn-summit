#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist/functions')
const TMP = join(ROOT, '.deploy-tmp')

const functions = process.argv.slice(2)

if (functions.length === 0) {
    console.error('Usage: node scripts/deploy.mjs <feature/method> [<feature/method> ...]')
    console.error('Example: node scripts/deploy.mjs markers/get markers/create')
    process.exit(1)
}

// Clean up tmp dir
if (existsSync(TMP)) rmSync(TMP, { recursive: true })
mkdirSync(TMP, { recursive: true })

let failed = false

for (const fn of functions) {
    const [feature, method] = fn.split('/')

    if (!feature || !method) {
        console.error(`Invalid function format: "${fn}" — expected "feature/method" e.g. "markers/get"`)
        failed = true
        continue
    }

    const functionName = `cairn-${process.env.ENVIRONMENT ?? 'dev'}-${feature}-${method}`
    const zipPath = join(TMP, `${feature}-${method}.zip`)
    const handlerDir = join(DIST, feature, method)
    const sharedDir = join(DIST, 'shared')

    if (!existsSync(handlerDir)) {
        console.error(`Handler not found: ${handlerDir}`)
        failed = true
        continue
    }

    console.log(`\nDeploying ${functionName}...`)

    try {
        // Zip handler + shared from dist/functions
        execSync(
            `cd ${DIST} && zip -r ${zipPath} ${feature}/${method} shared`,
            { stdio: 'inherit' }
        )

        // Upload to Lambda
        const profile = process.env.AWS_PROFILE ? `--profile ${process.env.AWS_PROFILE}` : ''

        execSync(
            `aws lambda update-function-code \
            --function-name ${functionName} \
            --zip-file fileb://${zipPath} \
            --region ${process.env.AWS_REGION ?? 'us-east-2'} \
            --no-cli-pager \
            ${profile}`,
            { stdio: 'inherit' }
        )

        console.log(`✓ ${functionName} deployed`)
    } catch (err) {
        console.error(`✗ Failed to deploy ${functionName}`)
        failed = true
    }
}

// Cleanup
rmSync(TMP, { recursive: true })

if (failed) {
    console.error('\nOne or more deployments failed.')
    process.exit(1)
}

console.log('\nAll deployments complete.')