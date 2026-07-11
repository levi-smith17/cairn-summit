'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { PlatformHeaderActions } from '@/components/nav/platform/header-actions'

interface PlatformHeaderProps {
  title: string
  actions?: React.ReactNode
}

export function PlatformHeader({ title, actions }: PlatformHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b bg-header transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 h-14 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="shrink-0" variant="outline" />
          <span className="font-medium text-sm truncate">{title}</span>
        </div>

        <PlatformHeaderActions extra={actions} />
      </div>
    </header>
  )
}
