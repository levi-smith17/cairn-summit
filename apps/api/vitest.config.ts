import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        include: ['functions/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            include: ['functions/**/*.ts'],
            exclude: ['functions/**/*.test.ts'],
        },
    },
    resolve: {
        alias: {
            '@cairn/types': resolve(__dirname, '../../packages/types/index.ts'),
        },
    },
})