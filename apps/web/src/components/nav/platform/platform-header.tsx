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
      <div className="grid grid-cols-3 items-center gap-2 px-4 h-14 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <SidebarTrigger className="shrink-0 justify-self-start" variant="outline" />
        <span className="font-medium text-sm text-center truncate">{title}</span>

        <div className="flex items-center gap-1 justify-self-end">
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
