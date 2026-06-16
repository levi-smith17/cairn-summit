import { Skeleton } from '@/components/ui/skeleton'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { cn } from '@/lib/utils'

interface PageSkeletonProps {
  title?: string
  hasFilterBar?: boolean
}

export function PageSkeleton({ title, hasFilterBar = false }: PageSkeletonProps) {
  return (
    <>
      {title && <PlatformHeader title={title} />}

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {hasFilterBar && (
          <div className="rounded-lg border border-border bg-card p-2 shrink-0">
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        )}

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className="flex flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-2 border-b border-border">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          <div className="hidden md:flex flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden" />
        </div>
      </div>
    </>
  )
}

export function SettingsContentSkeleton() {
  return (
    <div className="space-y-6 max-w-lg">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-9 w-28 mt-2" />
    </div>
  )
}

export function ManifestSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="flex flex-col flex-1 min-h-0 gap-4 p-4 overflow-hidden">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 shrink-0">
          {/* WayfarerOverview skeleton */}
          <div className="rounded-xl bg-muted/50 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-3.5 w-56" />
              ))}
            </div>
          </div>

          {/* ManifestSummary skeleton */}
          <div className="rounded-xl bg-muted/50 p-6 flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ManifestSections skeleton */}
        <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
          <div className="hidden md:flex flex-col w-48 shrink-0 rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
          <div className="flex flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center px-4 min-h-[48px] border-b border-border shrink-0">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1 p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function ProvisionsSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}

      <div className="flex flex-col flex-1 gap-4 p-4 min-h-0 overflow-y-auto lg:overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-0 overflow-hidden">
          <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card lg:overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5 border-b border-border">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="w-full lg:w-112 shrink-0 flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="px-3 py-2.5 border-b shrink-0">
                <Skeleton className="h-4 w-24" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-3 py-3 space-y-1.5 border-b border-border">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="px-3 py-2.5 border-b shrink-0">
                <Skeleton className="h-4 w-16" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-3 py-3 space-y-1.5 border-b border-border">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </>
  )
}

export function ListSectionSkeleton({
  rows = 4,
  compact = false,
  className,
}: {
  rows?: number
  compact?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col divide-y', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('space-y-1.5', compact ? 'px-3 py-3' : 'px-4 py-3')}>
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <>
      <PlatformHeader title="Settings" />
      <div className="flex flex-1 min-h-0 gap-4 p-4 overflow-hidden w-full">
        <div className="hidden md:flex flex-col w-52 shrink-0 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-2.5 border-b border-border/30">
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="flex flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 min-h-[48px] border-b border-border shrink-0 flex items-center">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <SettingsContentSkeleton />
          </div>
        </div>
      </div>
    </>
  )
}

export function ItinerarySkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="flex flex-1 p-4 overflow-hidden min-h-0">
        <div className="flex flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden min-w-0">
          <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 flex-1 max-w-48" />
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="flex-1 p-3 grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function BasecampSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-0 overflow-hidden">
          <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-2 border-b border-border">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="lg:w-72 shrink-0 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function GuidePassSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="flex flex-col flex-1 items-center justify-center gap-6 p-4 min-h-0">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full max-w-lg rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </>
  )
}

export function StarfieldSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="flex flex-col flex-1 gap-4 p-4 min-h-0 overflow-hidden">
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 flex-1" />
        </div>
        <Skeleton className="flex-1 min-h-64 rounded-lg" />
      </div>
    </>
  )
}

export function HeadwatersSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="flex flex-col flex-1 gap-4 p-4 min-h-0 overflow-hidden">
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-9" />
        </div>
        <Skeleton className="flex-1 min-h-96 rounded-lg" />
      </div>
    </>
  )
}

export function OutpostSkeleton({ title }: { title?: string }) {
  return (
    <>
      {title && <PlatformHeader title={title} />}
      <div className="w-full px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2 bg-card rounded-xl px-6 py-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-card rounded-xl p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="lg:col-span-1 bg-card rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
