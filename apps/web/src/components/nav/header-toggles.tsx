'use client'

import { BookType, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'
import { type TerminologyStyle } from '@/lib/terminology'

interface TerminologyToggleProps {
  terminology?: TerminologyStyle
  onToggle?: () => void
}

export function TerminologyToggle({ terminology: propTerminology, onToggle }: TerminologyToggleProps = {}) {
  const ctx = useTerminology()
  const terminology = propTerminology ?? ctx.terminology
  const toggleTerminology = onToggle ?? ctx.toggleTerminology

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-none gap-2 hover:bg-black/10 dark:hover:bg-white/10"
          onClick={toggleTerminology}
        >
          <BookType className="h-4 w-4" />
          <span className="hidden sm:inline">{terminology === 'CAIRN' ? 'Standard' : 'Cairn'}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {terminology === 'CAIRN' ? 'Switch to standard terminology' : 'Switch to Cairn terminology'}
      </TooltipContent>
    </Tooltip>
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-none hover:bg-black/10 dark:hover:bg-white/10"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
      </TooltipContent>
    </Tooltip>
  )
}
