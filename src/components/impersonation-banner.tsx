'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, X } from 'lucide-react'
import { stopImpersonation } from '@/actions/admin'

interface ImpersonationBannerProps {
  targetName: string
  targetEmail: string
}

export function ImpersonationBanner({ targetName, targetEmail }: ImpersonationBannerProps) {
  const router = useRouter()
  const [stopping, startStop] = useTransition()

  function handleStop() {
    startStop(async () => {
      await stopImpersonation()
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 shrink-0 text-sm">
      <Eye className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      <span className="flex-1 text-amber-800 dark:text-amber-300">
        Viewing as <strong>{targetName || targetEmail}</strong>
        <span className="ml-1 opacity-70">({targetEmail})</span>
        <span className="ml-1 text-xs opacity-60">— sidebar and select data reflects this user</span>
      </span>
      <button
        onClick={handleStop}
        disabled={stopping}
        className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors disabled:opacity-50"
      >
        <X className="h-3 w-3" />
        {stopping ? 'Stopping…' : 'Stop'}
      </button>
    </div>
  )
}
