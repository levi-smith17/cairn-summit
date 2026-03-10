'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

interface NavAction {
  label: string
  href: string
  icon: LucideIcon
}

interface HeaderNavActionsProps {
  navActions: NavAction[]
  primaryAction: React.ReactNode
}

export function HeaderNavActions({ navActions, primaryAction }: HeaderNavActionsProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      {/* Nav buttons — hidden on mobile, visible on desktop */}
      <div className="hidden md:flex items-center gap-2">
        {navActions.map(({ label, href, icon: Icon }) => (
          <Button
            key={href}
            size="sm"
            variant="outline"
            onClick={() => router.push(href)}
          >
            <Icon className="h-4 w-4 mr-1" />
            {label}
          </Button>
        ))}
      </div>

      {/* Ellipsis dropdown — visible on mobile only */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {navActions.map(({ label, href, icon: Icon }) => (
              <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Primary action — always visible */}
      {primaryAction}
    </div>
  )
}