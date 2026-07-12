"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  BookOpen,
  CalendarDays,
  Compass,
  LayoutDashboard,
  LayoutList,
  LayersIcon,
  LogIn,
  Mail,
  MessageSquare,
  NotebookPen,
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
import { usePublicProfileRoute } from '@/hooks/use-public-profile-route'
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
import { publicManifestPath, type PublicManifestView } from '@/lib/public-manifest-path'
import type { PlatformLayoutMode } from './layout'

type NavIcon = ComponentType<{ className?: string }>

interface NavItem {
  title: string
  url: string
  icon: NavIcon
  tooltip: string
}

function buildNavItems(terms: Terms): { group: string; items: NavItem[] }[] {
  const outpost: NavItem = {
    title: terms.outpost,
    url: '/',
    icon: LayoutList,
    tooltip: terms.outpost,
  }
  const rest: NavItem[] = [
    { title: terms.basecamp, url: '/basecamp', icon: LayoutDashboard, tooltip: terms.basecamp },
    { title: terms.itinerary, url: '/itinerary', icon: CalendarDays, tooltip: terms.itinerary },
    { title: terms.signals, url: '/signals', icon: MessageSquare, tooltip: terms.signals },
    { title: terms.guides, url: '/guides', icon: LayersIcon, tooltip: terms.guides },
    { title: terms.headwaters, url: '/headwaters', icon: TreePine, tooltip: terms.headwaters },
    { title: terms.logs, url: '/logs', icon: NotebookPen, tooltip: terms.logs },
    { title: terms.manifest, url: '/manifest', icon: BookOpen, tooltip: terms.manifest },
    { title: terms.provisions, url: '/provisions', icon: Wallet, tooltip: terms.provisions },
  ].sort((a, b) => a.title.localeCompare(b.title))

  return [
    {
      group: 'Platform',
      items: [outpost, ...rest],
    },
    {
      group: 'Admin',
      items: [
        { title: terms.wayfarers, url: '/admin', icon: Users, tooltip: terms.wayfarers },
      ],
    },
  ]
}

function buildPublicNavItems(terms: Terms): { group: string; items: NavItem[] }[] {
  return [
    {
      group: 'Platform',
      items: [
        { title: terms.outpost, url: '/', icon: LayoutList, tooltip: terms.outpost },
      ],
    },
  ]
}

function buildPublicProfileLinks(
  username: string,
  terms: Terms,
): { view: PublicManifestView; title: string; url: string; icon: NavIcon }[] {
  return [
    {
      view: 'manifest',
      title: terms.manifest,
      url: publicManifestPath(username, 'manifest'),
      icon: BookOpen,
    },
    {
      view: 'journey',
      title: terms.bio_button,
      url: publicManifestPath(username, 'journey'),
      icon: Compass,
    },
    {
      view: 'contact',
      title: terms.contact,
      url: publicManifestPath(username, 'contact'),
      icon: Mail,
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
  const publicProfile = usePublicProfileRoute()

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

  const ownUsername = wayfarer?.username ?? null
  const ownPublicLinks = ownUsername ? buildPublicProfileLinks(ownUsername, uiTerms) : []

  /** Name-headed section for direct public profile URLs (any visitor; skip when it's your own — covered under Platform). */
  const showRouteProfileSection =
    Boolean(publicProfile.username) && publicProfile.username !== ownUsername

  const routeProfileLinks = publicProfile.username
    ? buildPublicProfileLinks(publicProfile.username, uiTerms)
    : []

  return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <button
            type="button"
            className="flex w-full items-center justify-center py-2"
            onClick={() => handleClick('/')}
            aria-label={uiTerms.outpost}
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
                    const isActive =
                      url === '/'
                        ? pathname === '/'
                        : url === '/manifest'
                          ? pathname === '/manifest'
                          : pathname === url || pathname.startsWith(url + '/')
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

                {/* Authenticated: public view of own Manifest (URL scheme), separate from editor link above */}
                {group === 'Platform' && ownPublicLinks.length > 0 ? (
                  <>
                    <SidebarGroupLabel className="mt-2">Public View</SidebarGroupLabel>
                    <SidebarMenu>
                      {ownPublicLinks.map(({ title, url, icon: Icon, view }) => (
                        <SidebarMenuItem key={url}>
                          <SidebarMenuButton
                            onClick={() => handleClick(url)}
                            tooltip={title}
                            isActive={
                              publicProfile.username === ownUsername &&
                              publicProfile.view === view
                            }
                          >
                            <Icon className="h-4 w-4" />
                            <span>{title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </>
                ) : null}
              </SidebarGroup>
            ))}

          {showRouteProfileSection ? (
            <SidebarGroup>
              <SidebarGroupLabel>
                {publicProfile.displayName ?? publicProfile.username}
              </SidebarGroupLabel>
              <SidebarMenu>
                {routeProfileLinks.map(({ title, url, icon: Icon, view }) => (
                  <SidebarMenuItem key={url}>
                    <SidebarMenuButton
                      onClick={() => handleClick(url)}
                      tooltip={title}
                      isActive={publicProfile.view === view}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
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
                className={collapsed ? 'w-full' : 'w-full justify-center gap-2'}
              >
                <Link to="/login" onClick={() => isMobile && setOpenMobile(false)}>
                  <LogIn className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Log in</span>}
                </Link>
              </Button>
            </div>
          )}
          {!collapsed && <FooterNav />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
  )
}
