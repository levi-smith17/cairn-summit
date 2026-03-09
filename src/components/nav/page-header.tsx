import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface PageHeaderProps {
  title: string
  filters?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, filters, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-header transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-1 h-full shrink-0" />
      <span className="font-medium text-sm shrink-0">{title}</span>

      {filters && (
        <>
          <Separator orientation="vertical" className="mx-1 h-full shrink-0" />
          <div className="flex-1 min-w-0 overflow-x-auto">
            {filters}
          </div>
        </>
      )}

      {actions && (
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {actions}
        </div>
      )}
    </header>
  )
}