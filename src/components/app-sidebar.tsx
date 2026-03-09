"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Bookmark,
  Folder,
  LayoutDashboard,
  LayoutList,
  NotebookPen,
  Tag,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Waypoints",
      url: "/waypoints",
      icon: Bookmark,
      items: [
        { title: "All Waypoints", url: "/waypoints" },
        { title: "Folders", url: "/waypoints/folders" },
        { title: "Tags", url: "/waypoints/tags" },
      ],
    },
    {
      title: "Log",
      url: "/log",
      icon: NotebookPen,
      items: [
        { title: "All Entries", url: "/log" },
        { title: "Notebooks", url: "/log/notebooks" },
      ],
    },
    {
      title: "Provisions",
      url: "/provisions",
      icon: Wallet,
      items: [
        { title: "Subscriptions", url: "/provisions/subscriptions" },
        { title: "Expenses", url: "/provisions/expenses" },
        { title: "Budget", url: "/provisions/budget" },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  wayfarer: {
    name: string | null
    email: string | null
    avatar: string | null
  }
}

export function AppSidebar({ wayfarer, ...props }: AppSidebarProps) {
  const router = useRouter()

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
        {/* Dashboard button */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/')}
                tooltip="Directory"
              >
                <LayoutList className="h-4 w-4" />
                <span>Directory</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/dashboard')}
                tooltip="Dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/waypoints')}
                tooltip="Waypoints"
              >
                <Bookmark className="h-4 w-4" />
                <span>Waypoints</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/log')}
                tooltip="Log"
              >
                <NotebookPen className="h-4 w-4" />
                <span>Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/provisions')}
                tooltip="Provisions"
              >
                <Wallet className="h-4 w-4" />
                <span>Provisions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/folders')}
                tooltip="Folders"
              >
                <Folder className="h-4 w-4" />
                <span>Folders</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/tags')}
                tooltip="Tags"
              >
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser wayfarer={wayfarer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}