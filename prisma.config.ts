import path from 'node:path'
import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  schema: './prisma/schema.prisma'
})