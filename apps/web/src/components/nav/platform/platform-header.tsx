'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle, TerminologyToggle } from '@/components/nav/header-toggles'

interface PlatformHeaderProps {
  title: string
  actions?: React.ReactNode
}

export function PlatformHeader({ title, actions }: PlatformHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b bg-header transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 h-14 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 justify-between">
        <SidebarTrigger className="shrink-0" variant="outline" />
        <span className="font-medium text-sm shrink-0">{title}</span>

        <div className="flex items-center gap-1">
          {actions}

          <div className="flex items-center rounded-md border divide-x overflow-hidden">
            <TerminologyToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
