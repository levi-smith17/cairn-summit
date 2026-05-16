"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Folder,
  LayoutDashboard,
  LayoutList,
  LayersIcon,
  Mail,
  NotebookPen,
  Rocket,
  Search,
  Shield,
  Tag,
  TreePine,
  Wallet,
} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { FooterNav } from '@/components/nav/footer'
import { PlatformWayfarerMenu } from "@/components/nav/platform/platform-wayfarer-menu"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type LucideIcon } from "lucide-react"
import { type Terms } from '@/lib/terminology'

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

function buildNavItems(terms: Terms): { group: string; items: NavItem[] }[] {
  return [
    {
      group: 'Navigation',
      items: [
        { title: terms.outpost, url: '/', icon: LayoutList, tooltip: terms.outpost },
        { title: terms.basecamp, url: '/basecamp', icon: LayoutDashboard, tooltip: terms.basecamp },
        { title: terms.itinerary, url: '/itinerary', icon: CalendarDays, tooltip: terms.itinerary },
        { title: terms.signals, url: '/signals', icon: Mail, tooltip: terms.signals },
      ],
    },
    {
      group: 'Platform',
      items: [
        { title: terms.waypoints, url: '/waypoints', icon: Bookmark, tooltip: terms.waypoints },
        { title: terms.logs, url: '/logs', icon: NotebookPen, tooltip: terms.logs },
        { title: terms.provisions, url: '/provisions', icon: Wallet, tooltip: terms.provisions },
        { title: terms.guides, url: '/guides', icon: LayersIcon, tooltip: terms.guides },
        { title: terms.trails, url: '/trails', icon: Folder, tooltip: terms.trails },
        { title: terms.markers, url: '/markers', icon: Tag, tooltip: terms.markers },
      ],
    },
    {
      group: 'Admin',
      items: [
        { title: terms.wayfarers, url: '/admin', icon: Shield, tooltip: terms.wayfarers },
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
    signals: number
    itinerary: number
  }
  terms?: Terms
}

export function PlatformSidebar({ wayfarer, badges, terms, ...props }: PlatformSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { state } = useSidebar()
  const { isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed'
  const { terms: uiTerms } = useTerminology()
  const navItems = buildNavItems(uiTerms)

  function getBadge(url: string): number {
    if (url === '/signals')   return badges?.signals   ?? 0
    if (url === '/itinerary') return badges?.itinerary ?? 0
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
          {/* Global search trigger */}
          <div className={collapsed ? '' : 'px-2 pb-1'}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('cairn:open-search'))}
              className={`
                flex items-center gap-2 w-full rounded-md border border-border/60
                px-2.5 py-1.5 text-xs text-muted-foreground
                hover:text-foreground hover:bg-muted/50 transition-colors
                ${collapsed ? 'justify-center' : ''}
              `}
              title="Search (⌘K)"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{uiTerms.explore}…</span>
                  <kbd className="text-[10px] font-mono opacity-50">⌘K</kbd>
                </>
              )}
            </button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {navItems.filter(({ group }) => group !== 'Admin' || wayfarer.isAdmin).map(({ group, items }) => (
              <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarMenu>
                  {items.map(({ title, url, icon: Icon, tooltip, children }) => {
                    const isActive = children
                        ? pathname.startsWith(url)
                        : pathname === url

                    if (children) {
                      // When collapsed the collapsible sub-items are invisible.
                      // Show a right-anchored dropdown with all sub-items instead.
                      if (collapsed) {
                        return (
                          <SidebarMenuItem key={url}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuButton tooltip={tooltip} isActive={isActive}>
                                  <Icon className="h-4 w-4" />
                                  <span>{title}</span>
                                </SidebarMenuButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start" className="min-w-40">
                                {children.map(child => (
                                  <DropdownMenuItem
                                    key={child.url}
                                    onClick={() => handleClick(child.url)}
                                    className={pathname === child.url ? 'bg-accent' : ''}
                                  >
                                    {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                                    {child.title}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuItem>
                        )
                      }

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
                                            onClick={() => handleClick(child.url)}
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
        <SidebarFooter>
          <PlatformWayfarerMenu wayfarer={wayfarer} terms={terms} />
          {!collapsed && <FooterNav />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
  )
}