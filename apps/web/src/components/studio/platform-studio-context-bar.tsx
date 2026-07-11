'use client'

import { StudioContextBar } from '@/components/studio/layout/studio-context-bar'
import { PlatformHeaderActions } from '@/components/nav/platform/header-actions'

/** Studio page header with global actions (search / pin / public manifest) and optional page actions on the right. */
export function PlatformStudioContextBar({
  'aria-label': ariaLabel,
  title,
  subtitle,
  metadata,
  tabs,
  actions,
  showInspectorPin = false,
}: {
  'aria-label': string
  title: string
  subtitle?: string
  metadata?: React.ReactNode
  tabs?: React.ReactNode
  /** Page-specific actions (e.g. Add buttons) rendered after the global cluster, on the far right. */
  actions?: React.ReactNode
  showInspectorPin?: boolean
}) {
  return (
    <StudioContextBar
      aria-label={ariaLabel}
      title={title}
      subtitle={subtitle}
      metadata={metadata}
      tabs={tabs}
      actions={<PlatformHeaderActions trailing={actions} showInspectorPin={showInspectorPin} />}
    />
  )
}
