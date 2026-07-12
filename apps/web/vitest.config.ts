import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // CognitoUserPool throws at module load if these are missing (CI has no Vite .env).
    env: {
      VITE_COGNITO_CLIENT_ID: 'test-client-id',
      VITE_COGNITO_USER_POOL_ID: 'us-east-1_TestPoolId',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})