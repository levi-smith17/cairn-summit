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
      <div className="flex min-h-14 items-center gap-3 px-4 py-2">
        <SidebarTrigger className="shrink-0" variant="outline" />
        <Separator orientation="vertical" className="mr-1 h-full shrink-0 hidden md:block" />
        <span className="font-medium text-sm shrink-0">{title}</span>

        {filters && (
          <>
            <Separator orientation="vertical" className="mx-1 h-full shrink-0 hidden 3xl:block" />
            <div className="flex-1 min-w-0 hidden 3xl:block">
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

      {filters && (
        <div className="3xl:hidden px-4 pb-3">
          {filters}
        </div>
      )}
    </header>
  )
}

