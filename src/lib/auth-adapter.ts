import { PrismaAdapter } from '@auth/prisma-adapter'
import type { PrismaClient } from '@prisma/client'

export default function CairnAdapter(prisma: PrismaClient) {
  const adapter = PrismaAdapter(prisma as any)
  
  return {
    ...adapter,
    async getUserByAccount(providerAccountId: {
      provider: string
      providerAccountId: string
    }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: providerAccountId.provider,
            providerAccountId: providerAccountId.providerAccountId,
          },
        },
        include: { user: true },
      })
      return (account as any)?.user ?? null
    },
    async createUser(data: any) {
      return prisma.wayfarer.create({ data }) as any
    },
    async getUser(id: string) {
      return prisma.wayfarer.findUnique({ where: { id } }) as any
    },
    async getUserByEmail(email: string) {
      return prisma.wayfarer.findUnique({ where: { email } }) as any
    },
    async updateUser(data: any) {
      return prisma.wayfarer.update({
        where: { id: data.id },
        data,
      }) as any
    },
    async deleteUser(id: string) {
      return prisma.wayfarer.delete({ where: { id } }) as any
    },
    async linkAccount(data: any) {
      return prisma.account.create({ data }) as any
    },
    async unlinkAccount(providerAccountId: {
      provider: string
      providerAccountId: string
    }) {
      return prisma.account.delete({
        where: { provider_providerAccountId: providerAccountId },
      }) as any
    },
    async createSession(data: any) {
      return prisma.session.create({ data }) as any
    },
    async getSessionAndUser(sessionToken: string) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })
      if (!session) return null
      const { user, ...sessionData } = session as any
      return { session: sessionData, user }
    },
    async updateSession(data: any) {
      return prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      }) as any
    },
    async deleteSession(sessionToken: string) {
      return prisma.session.delete({ where: { sessionToken } }) as any
    },
    async createVerificationToken(data: any) {
      return prisma.verificationToken.create({ data }) as any
    },
    async useVerificationToken(params: {
      identifier: string
      token: string
    }) {
      return prisma.verificationToken.delete({
        where: {
          identifier_token: params,
        },
      }) as any
    },
  }
}