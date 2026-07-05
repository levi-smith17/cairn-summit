import { createHash, randomBytes } from 'node:crypto'

export const API_TOKEN_PREFIX = 'csk_'

export type ApiTokenRecord = {
  pk: string
  sk: 'API_TOKEN'
  tokenHash: string
  tokenPrefix: string
  createdAt: string
  lastUsedAt?: string
}

export type ApiTokenLookupRecord = {
  pk: string
  sk: 'META'
  userId: string
  tokenPrefix: string
  createdAt: string
}

export function generateApiToken(): string {
  return `${API_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function isApiToken(value: string): boolean {
  return value.startsWith(API_TOKEN_PREFIX)
}

export function tokenLookupPk(token: string): string {
  return `TOKEN#${hashApiToken(token)}`
}

export function userTokenPk(userId: string): string {
  return `USER#${userId}`
}

export function tokenPrefixFromToken(token: string): string {
  return token.slice(0, API_TOKEN_PREFIX.length + 8)
}
