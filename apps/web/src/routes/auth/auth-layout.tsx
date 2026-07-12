import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'

/** Auth form chrome inside the platform sidebar shell. */
export function AuthLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PlatformStudioContextBar aria-label={title} title={title} />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-muted/50 p-6">{children}</div>
      </div>
    </div>
  )
}
