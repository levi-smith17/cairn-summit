import { Link } from 'react-router-dom'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'

export default function NotFound() {
  const { terms } = useTerminology()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PlatformStudioContextBar aria-label="Not found" title="Not found" />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-12">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-card px-10 py-10 text-center">
          <div className="rounded-full bg-muted p-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              404
            </span>
            <h1 className="text-2xl font-semibold">Trail Not Found</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ve wandered off the marked path. This cairn doesn&apos;t exist — or it may have
              been moved further up the mountain.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link to="/">Return to {terms.outpost}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
