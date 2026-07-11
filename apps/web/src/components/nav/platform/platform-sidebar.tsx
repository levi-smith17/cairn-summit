"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  Folder,
  LayoutDashboard,
  LayoutList,
  LayersIcon,
  MessageSquare,
  NotebookPen,
  Rocket,
  Tag,
  TreePine,
  Users,
  Wallet,
} from "lucide-react"
import type { ComponentType } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FooterNav } from '@/components/nav/footer'
import { PlatformWayfarerMenu } from "@/components/nav/platform/platform-wayfarer-menu"
import { SidebarUtilities } from "@/components/nav/platform/sidebar-utilities"
import { useTerminology } from '@/contexts/terminology-context'
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
  SidebarRail,
} from "@/components/ui/sidebar"
import { type Terms } from '@/lib/terminology'

type NavIcon = ComponentType<{ className?: string }>

interface NavItem {
  title: string
  url: string
  icon: NavIcon
  tooltip: string
}

function buildNavItems(terms: Terms): { group: string; items: NavItem[] }[] {
  return [
    {
      group: 'Navigation',
      items: [
        { title: terms.outpost, url: '/', icon: LayoutList, tooltip: terms.outpost },
        { title: terms.basecamp, url: '/basecamp', icon: LayoutDashboard, tooltip: terms.basecamp },
        { title: terms.itinerary, url: '/itinerary', icon: CalendarDays, tooltip: terms.itinerary },
        { title: terms.signals, url: '/signals', icon: MessageSquare, tooltip: terms.signals },
      ],
    },
    {
      group: 'Platform',
      items: [
        { title: terms.waypoints, url: '/waypoints', icon: Bookmark, tooltip: terms.waypoints },
        { title: terms.logs, url: '/logs', icon: NotebookPen, tooltip: terms.logs },
        { title: terms.provisions, url: '/provisions', icon: Wallet, tooltip: terms.provisions },
        { title: terms.manifest, url: '/manifest', icon: BookOpen, tooltip: terms.manifest },
        { title: terms.guides, url: '/guides', icon: LayersIcon, tooltip: terms.guides },
        { title: terms.trails, url: '/trails', icon: Folder, tooltip: terms.trails },
        { title: terms.markers, url: '/markers', icon: Tag, tooltip: terms.markers },
      ],
    },
    {
      group: 'Admin',
      items: [
        { title: terms.wayfarers, url: '/admin', icon: Users, tooltip: terms.wayfarers },
      ],
    },
    {
      group: 'Apps',
      items: [
        { title: terms.headwaters, url: '/headwaters', icon: TreePine, tooltip: terms.headwaters },
        { title: 'Starfield', url: '/starfield', icon: Rocket, tooltip: 'Starfield' },
      ],
    },
  ]
}

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  wayfarer: {
    username: string | null
    name: string | null
    email: string | null
    avatar: string | null
    isAdmin: boolean
  }
  badges?: {
    itinerary: number
    signals: number
  }
}

export function PlatformSidebar({ wayfarer, badges, ...props }: PlatformSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { state } = useSidebar()
  const { isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed'
  const { terms: uiTerms } = useTerminology()
  const navItems = buildNavItems(uiTerms)

  function getBadge(url: string): number {
    if (url === '/itinerary') return badges?.itinerary ?? 0
    if (url === '/signals') return badges?.signals ?? 0
    return 0
  }

  const handleClick = (url : string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-center py-2">
            <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={180} width={180} />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {navItems.filter(({ group }) => group !== 'Admin' || wayfarer.isAdmin).map(({ group, items }) => (
              <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarMenu>
                  {items.map(({ title, url, icon: Icon, tooltip }) => {
                    const isActive = pathname === url || (url !== '/' && pathname.startsWith(url + '/'))
                    const badge = getBadge(url)
                    return (
                        <SidebarMenuItem key={url}>
                          <SidebarMenuButton
                              onClick={() => handleClick(url)}
                              tooltip={tooltip}
                              isActive={isActive}
                          >
                            <div className="relative shrink-0">
                              <Icon className="h-4 w-4" />
                              {collapsed && badge > 0 && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <span>{title}</span>
                            {!collapsed && badge > 0 && (
                              <span className="ml-auto text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none tabular-nums">
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
        </SidebarContent>
        <SidebarFooter className="gap-2">
          <SidebarUtilities />
          <PlatformWayfarerMenu wayfarer={wayfarer} />
          {!collapsed && <FooterNav />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
  )
}
