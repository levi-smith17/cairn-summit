'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuItem
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4" />
          Light mode
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          Dark mode
        </>
      )}
    </DropdownMenuItem>
  )
}