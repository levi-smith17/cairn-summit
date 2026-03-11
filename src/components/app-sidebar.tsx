"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Bookmark,
  ChevronRight,
  Database,
  Factory,
  Folder,
  Globe,
  LayoutDashboard,
  LayoutList,
  Mail,
  NotebookPen,
  Rocket,
  Tag,
  Wallet,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { CairnLockup } from '@/components/cairn-lockup'
import { CairnLogo } from '@/components/cairn-logo'
import { NavUser } from "@/components/nav/wayfarer/wayfarer-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { type LucideIcon } from "lucide-react"

interface NavSubItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  tooltip: string
  children?: NavSubItem[]
}

const navItems: { group: string; items: NavItem[] }[] = [
  {
    group: 'Navigation',
    items: [
      { title: 'Directory', url: '/', icon: LayoutList, tooltip: 'Directory' },
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
      { title: 'Messages', url: '/messages', icon: Mail, tooltip: 'Messages' },
    ],
  },
  {
    group: 'Platform',
    items: [
      { title: 'Waypoints', url: '/waypoints', icon: Bookmark, tooltip: 'Waypoints' },
      { title: 'Log', url: '/log', icon: NotebookPen, tooltip: 'Log' },
      { title: 'Provisions', url: '/provisions', icon: Wallet, tooltip: 'Provisions' },
      { title: 'Folders', url: '/folders', icon: Folder, tooltip: 'Folders' },
      { title: 'Tags', url: '/tags', icon: Tag, tooltip: 'Tags' },
    ],
  },
  {
    group: 'Apps',
    items: [
      {
        title: 'Starfield',
        url: '/starfield',
        icon: Rocket,
        tooltip: 'Starfield',
        children: [
          { title: 'Facilities', url: '/starfield/facilities', icon: Factory },
          { title: 'Resources', url: '/starfield/resources', icon: Database },
          { title: 'Systems', url: '/starfield/systems', icon: Globe },
        ],
      },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  wayfarer: {
    name: string | null
    email: string | null
    avatar: string | null
  }
}

export function AppSidebar({ wayfarer, ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center py-2">
          {collapsed ? (
            <CairnLogo className="h-8 w-8" />
          ) : (
            <CairnLockup className="w-full" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map(({ group, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map(({ title, url, icon: Icon, tooltip, children }) => {
                const isActive = children
                  ? pathname.startsWith(url)
                  : pathname === url

                if (children) {
                  return (
                    <Collapsible key={url} defaultOpen={isActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={tooltip} isActive={isActive}>
                            <Icon className="h-4 w-4" />
                            <span>{title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {children.map(child => (
                              <SidebarMenuSubItem key={child.url}>
                                <SidebarMenuSubButton
                                  onClick={() => router.push(child.url)}
                                  isActive={pathname === child.url}
                                >
                                  {child.icon && <child.icon className="h-4 w-4" />}
                                  {child.title}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={url}>
                    <SidebarMenuButton
                      onClick={() => router.push(url)}
                      tooltip={tooltip}
                      isActive={isActive}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser wayfarer={wayfarer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}