import { cn } from '@/lib/utils'
import { STUDIO_RAIL_WIDTH } from '@/components/studio/layout/studio-layout'

function Block({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

function StudioContextBarSkeleton({
  tabs = false,
  metadata = false,
}: {
  tabs?: boolean
  metadata?: boolean
}) {
  return (
    <header
      className={cn(
        'box-border shrink-0 border-b border-border bg-header',
        tabs
          ? 'lg:grid lg:h-14 lg:min-h-14 lg:max-h-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-2 lg:overflow-hidden lg:px-4'
          : 'flex h-14 min-h-14 max-h-14 items-center justify-between gap-2 overflow-hidden px-3 sm:px-4',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Block className="h-8 w-8 shrink-0 rounded-md" />
        <div className="min-w-0 space-y-1.5">
          <Block className="h-3.5 w-28" />
          <Block className="h-2.5 w-40" />
        </div>
        {metadata ? <Block className="ml-1 h-5 w-16 rounded-full" /> : null}
      </div>
      {tabs ? (
        <div className="hidden items-center gap-2 lg:flex">
          <Block className="h-8 w-24 rounded-md" />
          <Block className="h-8 w-24 rounded-md" />
        </div>
      ) : null}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Block className="h-8 w-8 rounded-md" />
        <Block className="h-8 w-8 rounded-md" />
        <Block className="h-8 w-8 rounded-md" />
      </div>
    </header>
  )
}

function StudioRailSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="hidden shrink-0 flex-col overflow-hidden border-r border-border bg-column-rail lg:flex"
      style={{ width: STUDIO_RAIL_WIDTH }}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <Block className="h-4 w-24" />
        <Block className="h-7 w-7 rounded-md" />
      </div>
      <div className="shrink-0 border-b border-border px-3 py-2">
        <Block className="h-8 w-full rounded-md" />
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-hidden p-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5 rounded-lg px-2 py-2.5">
            <div className="flex items-center gap-2">
              <Block className="h-4 flex-1" />
              <Block className="h-3 w-6" />
            </div>
            <Block className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

function StudioInspectorHintSkeleton() {
  return (
    <aside className="hidden h-full w-10 shrink-0 border-l border-border bg-column-inspector md:block" />
  )
}

function StudioDataToolbarSkeleton() {
  return (
    <div className="box-border flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border bg-context-bar px-3 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-end gap-1.5 sm:gap-2">
        <Block className="h-8 w-40 rounded-md" />
        <Block className="h-8 w-8 rounded-md" />
        <Block className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
}

/** Generic studio shell: context bar + optional rail + canvas + inspector hint. */
export function StudioPageSkeleton({
  rail = true,
  railRows = 6,
  tabs = false,
  metadata = false,
  toolbar = false,
  canvas,
}: {
  rail?: boolean
  railRows?: number
  tabs?: boolean
  metadata?: boolean
  toolbar?: boolean
  canvas?: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StudioContextBarSkeleton tabs={tabs} metadata={metadata} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {rail ? <StudioRailSkeleton rows={railRows} /> : null}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {toolbar ? <StudioDataToolbarSkeleton /> : null}
          {canvas ?? (
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-4 sm:p-6">
              <Block className="h-8 w-48" />
              <Block className="h-4 w-full max-w-xl" />
              <Block className="h-4 w-5/6 max-w-lg" />
              <Block className="h-32 w-full max-w-2xl" />
            </div>
          )}
        </div>
        <StudioInspectorHintSkeleton />
      </div>
    </div>
  )
}

export function SignalsStudioSkeleton() {
  return (
    <StudioPageSkeleton
      rail={false}
      metadata
      toolbar
      canvas={
        <div className="min-h-0 flex-1 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start justify-between border-b border-border/50 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Block className="h-2 w-2 rounded-full" />
                  <Block className="h-3.5 w-32" />
                </div>
                <Block className="h-3 w-48" />
                <Block className="h-3 w-full max-w-md" />
                <Block className="h-2.5 w-20" />
              </div>
              <Block className="ml-2 h-6 w-6 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      }
    />
  )
}

export function LogsStudioSkeleton() {
  return (
    <StudioPageSkeleton
      rail
      railRows={5}
      canvas={
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6">
          <Block className="h-10 w-10 rounded-full" />
          <Block className="h-4 w-36" />
          <Block className="h-3 w-64 max-w-full" />
        </div>
      }
    />
  )
}

export function ProvisionsStudioSkeleton() {
  return (
    <StudioPageSkeleton
      rail
      railRows={6}
      metadata
      toolbar
      canvas={
        <div className="min-h-0 flex-1 space-y-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-border/50 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Block className="h-3.5 w-40" />
                <Block className="h-3 w-24" />
              </div>
              <Block className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      }
    />
  )
}

export function ManifestStudioSkeleton() {
  return (
    <StudioPageSkeleton
      rail
      railRows={7}
      tabs
      canvas={
        <div className="min-h-0 flex-1 space-y-4 overflow-hidden p-6">
          <div className="flex items-center gap-3">
            <Block className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Block className="h-5 w-40" />
              <Block className="h-3.5 w-56" />
            </div>
          </div>
          <Block className="h-4 w-full max-w-xl" />
          <Block className="h-4 w-5/6 max-w-lg" />
          <div className="space-y-3 pt-4">
            <Block className="h-5 w-32" />
            <Block className="h-20 w-full max-w-2xl rounded-lg" />
            <Block className="h-20 w-full max-w-2xl rounded-lg" />
          </div>
        </div>
      }
    />
  )
}
