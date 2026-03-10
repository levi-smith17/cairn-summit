import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface PageHeaderProps {
  title: string
  filters?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, filters, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b bg-header transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/* Main row — always visible */}
      <div className="flex h-14 items-center gap-3 px-4">
        <SidebarTrigger className="shrink-0" variant="outline" />
        <Separator orientation="vertical" className="mr-1 h-full shrink-0 hidden md:block" />
        <span className="font-medium text-sm shrink-0">{title}</span>

        {/* Filters — hidden on mobile, visible on desktop */}
        {filters && (
          <>
            <Separator orientation="vertical" className="mx-1 h-full shrink-0 hidden md:block" />
            <div className="flex-1 min-w-0 overflow-x-auto hidden md:block">
              {filters}
            </div>
          </>
        )}

        {actions && (
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Filters row — mobile only, shown below main row */}
      {filters && (
        <div className="md:hidden px-4 pb-2">
          {filters}
        </div>
      )}
    </header>
  )
}