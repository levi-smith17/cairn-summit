import NextAuth from 'next-auth'
import { prisma } from '@/lib/prisma'
import CairnAdapter from '@/lib/auth-adapter'
import GitHub from 'next-auth/providers/github'
import Nodemailer from 'next-auth/providers/nodemailer'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: CairnAdapter(prisma as any),
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          const wayfarer = await prisma.wayfarer.upsert({
            where: { email: credentials.email as string },
            update: {},
            create: { email: credentials.email as string },
          })
          return wayfarer as any
        }
        return null
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
})