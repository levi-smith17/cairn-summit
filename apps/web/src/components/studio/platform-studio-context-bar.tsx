'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { StudioContextBar } from '@/components/studio/layout/studio-context-bar'
import { PlatformHeaderActions } from '@/components/nav/platform/header-actions'

/** Studio page header with Cairn sidebar trigger + global actions (search / pin / public manifest). */
export function PlatformStudioContextBar({
  'aria-label': ariaLabel,
  title,
  subtitle,
  metadata,
  tabs,
  actions,
}: {
  'aria-label': string
  title: string
  subtitle?: string
  metadata?: React.ReactNode
  tabs?: React.ReactNode
  /** Page-specific actions rendered before the global search/pin/manifest cluster. */
  actions?: React.ReactNode
}) {
  return (
    <StudioContextBar
      aria-label={ariaLabel}
      title={title}
      subtitle={subtitle}
      leading={<SidebarTrigger className="shrink-0" variant="outline" />}
      metadata={metadata}
      tabs={tabs}
      actions={<PlatformHeaderActions extra={actions} />}
    />
  )
}
