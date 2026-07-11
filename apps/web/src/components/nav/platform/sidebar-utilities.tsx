'use client'

import { BookType, Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from '@/components/ui/sidebar'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'

export function SidebarUtilities() {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const { pathname } = useLocation()
  const { terminology, toggleTerminology } = useTerminology()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const termsLabel = terminology === 'CAIRN' ? 'Standard' : 'Cairn'
  const termsTooltip =
    terminology === 'CAIRN' ? 'Switch to standard terminology' : 'Switch to Cairn terminology'
  const themeIsDark = mounted && resolvedTheme === 'dark'

  function closeMobile() {
    if (isMobile) setOpenMobile(false)
  }

  const termsButton = (
    <Button
      type="button"
      variant="secondary"
      size={collapsed ? 'icon' : 'sm'}
      className={cn(
        'h-8',
        collapsed ? 'w-full' : 'min-w-0 flex-1 gap-1.5 px-2',
      )}
      onClick={toggleTerminology}
      aria-label={termsTooltip}
    >
      <BookType className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate text-xs">{termsLabel}</span>}
    </Button>
  )

  const themeButton = (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => setTheme(themeIsDark ? 'light' : 'dark')}
      aria-label={themeIsDark ? 'Light mode' : 'Dark mode'}
      disabled={!mounted}
    >
      {themeIsDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )

  const settingsActive = pathname.startsWith('/settings')
  const settingsButton = (
    <Button
      asChild
      variant="secondary"
      size="icon"
      className={cn(
        'h-8 w-8 shrink-0',
        settingsActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
      )}
    >
      <Link to="/settings" aria-label="Settings" onClick={closeMobile}>
        <Settings className="h-4 w-4" />
      </Link>
    </Button>
  )

  return (
    <div
      className={cn(
        'w-full',
        collapsed ? 'flex flex-col items-stretch gap-1' : 'flex items-center gap-1',
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>{termsButton}</TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'top'}>{termsTooltip}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>{themeButton}</TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'top'}>
          {themeIsDark ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>{settingsButton}</TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'top'}>Settings</TooltipContent>
      </Tooltip>
    </div>
  )
}
