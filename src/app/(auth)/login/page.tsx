import { signIn } from '@/auth'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm px-4 sm:px-6">

        <img
          src="/cairn-lockup.svg"
          alt="Cairn"
          width={280}
          height={100}
        />

        {/* Magic Link */}
        <form
          className="w-full flex flex-col gap-3"
          action={async (formData: FormData) => {
            'use server'
            await signIn('nodemailer', {
              email: formData.get('email'),
              redirectTo: '/dashboard',
            })
          }}
        >
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm tracking-wide text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 px-8 py-2 text-sm tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
          >
            send magic link
          </button>
        </form>

        <div className="flex items-center w-full gap-3">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs tracking-widest text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        {/* Credentials */}
        {/*<form
          className="w-full flex flex-col gap-3"
          action={async (formData: FormData) => {
            'use server'
            await signIn('credentials', {
              email: formData.get('email'),
              password: formData.get('password'),
              redirectTo: '/dashboard',
            })
          }}
        >
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm tracking-wide text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <input
            name="password"
            type="password"
            placeholder="password"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm tracking-wide text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 px-8 py-2 text-sm tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
          >
            sign in
          </button>
        </form>

        <div className="flex items-center w-full gap-3">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs tracking-widest text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>*/}

        {/* GitHub */}
        <form
          className="w-full"
          action={async () => {
            'use server'
            await signIn('github', { redirectTo: '/dashboard' })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 px-8 py-2 text-sm tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
          >
            continue with github
          </button>
        </form>

      </div>
    </div>
  )
}