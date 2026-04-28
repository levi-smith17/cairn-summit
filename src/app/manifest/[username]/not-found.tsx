'use client'

import { CairnLogo } from '@/components/cairn-logo'
import Link from 'next/link'

export default function NotFound() {
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <CairnLogo className="h-16 w-16" />
      <h1 className="text-2xl font-semibold">Lost on the trail</h1>
      <p className="text-sm text-muted-foreground">
        This wayfarer couldn't be found.
      </p>
      <Link
        href="/"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Return home
      </Link>
    </div>
  )
}