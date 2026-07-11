"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LayoutList,
  LayersIcon,
  LogIn,
  MessageSquare,
  NotebookPen,
  Rocket,
  TreePine,
  Users,
  Wallet,
} from "lucide-react"
import type { ComponentType } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import { type Terms } from '@/lib/terminology'
import type { PlatformLayoutMode } from './layout'

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

function buildPublicNavItems(terms: Terms): { group: string; items: NavItem[] }[] {
  return [
    {
      group: 'Navigation',
      items: [
        { title: terms.outpost, url: '/', icon: LayoutList, tooltip: terms.outpost },
      ],
    },
  ]
}

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  mode?: PlatformLayoutMode
  wayfarer: {
    username: string | null
    name: string | null
    email: string | null
    avatar: string | null
    isAdmin: boolean
  } | null
  badges?: {
    itinerary: number
    signals: number
  }
}

export function PlatformSidebar({
  mode = 'full',
  wayfarer,
  badges,
  ...props
}: PlatformSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { state } = useSidebar()
  const { isMobile, setOpenMobile } = useSidebar()
  const collapsed = state === 'collapsed'
  const { terms: uiTerms } = useTerminology()
  const isPublic = mode === 'public'
  const isAuthenticated = Boolean(wayfarer)
  const navItems = isPublic ? buildPublicNavItems(uiTerms) : buildNavItems(uiTerms)

  function getBadge(url: string): number {
    if (url === '/itinerary') return badges?.itinerary ?? 0
    if (url === '/signals') return badges?.signals ?? 0
    return 0
  }

  const handleClick = (url: string) => {
    navigate(url)
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <button
            type="button"
            className="flex w-full items-center justify-center py-2"
            onClick={() => handleClick(isAuthenticated && isPublic ? '/basecamp' : '/')}
            aria-label={isAuthenticated && isPublic ? uiTerms.basecamp : uiTerms.outpost}
          >
            <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={180} width={180} />
          </button>
        </SidebarHeader>
        <SidebarContent>
          {navItems
            .filter(({ group }) => group !== 'Admin' || Boolean(wayfarer?.isAdmin))
            .map(({ group, items }) => (
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
          <SidebarUtilities showSettings={isAuthenticated} />
          {isAuthenticated && wayfarer ? (
            <PlatformWayfarerMenu wayfarer={wayfarer} />
          ) : (
            <div className={collapsed ? 'flex flex-col gap-1' : 'flex flex-col gap-1.5'}>
              <Button
                asChild
                variant="secondary"
                size={collapsed ? 'icon' : 'sm'}
                className={collapsed ? 'w-full' : 'w-full justify-start gap-2'}
              >
                <Link to="/login" onClick={() => isMobile && setOpenMobile(false)}>
                  <LogIn className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Log in</span>}
                </Link>
              </Button>
              {!collapsed && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/signup" onClick={() => isMobile && setOpenMobile(false)}>
                    Sign up
                  </Link>
                </Button>
              )}
            </div>
          )}
          {!collapsed && <FooterNav />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
  )
}
