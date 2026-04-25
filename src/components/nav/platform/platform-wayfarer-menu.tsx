"use client"
import { logout } from '@/actions/auth'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  BookUser,
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { type Terms } from '@/lib/terminology'

interface PlatformWayfarerMenuProps {
  wayfarer: {
    username: string | null
    name: string | null
    email: string | null
    avatar: string | null
    isAdmin: boolean
  }
  terms?: Terms
}

export function PlatformWayfarerMenu({ wayfarer, terms }: PlatformWayfarerMenuProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouter()

  function navigate(url: string) {
    if (isMobile) setOpenMobile(false)
    router.push(url)
  }

  return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={wayfarer.avatar ?? undefined} alt={wayfarer.name ?? undefined} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{wayfarer.name}</span>
                  <span className="truncate text-xs">{wayfarer.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={wayfarer.avatar ?? undefined} alt={wayfarer.name ?? undefined} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{wayfarer.name}</span>
                    <span className="truncate text-xs">{wayfarer.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  My {terms?.manifest ?? 'Manifest'}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/manifest')}>
                  <BookOpen className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/manifest/' + wayfarer.username)}>
                  <BookUser className="h-4 w-4" />
                  View Public
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
  )
}
