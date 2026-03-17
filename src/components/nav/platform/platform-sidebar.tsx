"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Bookmark,
  Car,
  ChevronRight,
  Database,
  Earth,
  Factory,
  Folder,
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
        { title: terms.signals, url: '/signals', icon: Mail, tooltip: terms.signals },
      ],
    },
    {
      group: 'Platform',
      items: [
        { title: terms.waypoints, url: '/waypoints', icon: Bookmark, tooltip: terms.waypoints },
        { title: terms.logs, url: '/logs', icon: NotebookPen, tooltip: terms.logs },
        { title: terms.provisions, url: '/provisions', icon: Wallet, tooltip: terms.provisions },
        { title: terms.trails, url: '/trails', icon: Folder, tooltip: terms.trails },
        { title: terms.markers, url: '/markers', icon: Tag, tooltip: terms.markers },
      ],
    },
    {
      group: 'Apps',
      items: [
        {
          title: 'Doordash',
          url: '/doordash',
          icon: Car,
          tooltip: 'Doordash',
        },
        {
          title: 'Starfield',
          url: '/starfield',
          icon: Rocket,
          tooltip: 'Starfield',
          children: [
            { title: 'Facilities', url: '/starfield/facilities', icon: Factory },
            { title: 'Resources', url: '/starfield/resources', icon: Database },
            { title: 'Systems', url: '/starfield/systems', icon: Earth },
          ],
        },
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
  terms?: Terms
}

export function PlatformSidebar({ wayfarer, terms, ...props }: PlatformSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const { isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed'
  const navItems = buildNavItems(useTerminology().terms)

  const handleClick = (url : string) => {
    router.push(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
          {navItems.filter(({ group }) => group !== 'Apps' || wayfarer.isAdmin).map(({ group, items }) => (
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

                    return (
                        <SidebarMenuItem key={url}>
                          <SidebarMenuButton
                              onClick={() => handleClick(url)}
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
          <PlatformWayfarerMenu wayfarer={wayfarer} terms={terms} />
          <FooterNav />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
  )
}