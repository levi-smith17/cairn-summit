import { ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react'
import { useRef } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Button } from '@/components/ui/button'
import { useAsgardAvailability } from '@/hooks/use-asgard-availability'
import { useAsgardNav } from '@/hooks/use-asgard-nav'
import { useAuth } from '@/hooks/use-auth'
import {
  ASGARD_ALLOWED_EMAIL,
  ASGARD_BASE_URL,
  asgardEmbedUrl,
  asgardSectionForKey,
} from '@/lib/asgard-embed'

function AsgardUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500">
          <TriangleAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Asgard is only available in network</h2>
          <p className="text-sm text-muted-foreground">
            Cairn could not reach {ASGARD_BASE_URL}. Connect to your local network, then try again.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Check again
        </Button>
      </div>
    </div>
  )
}

export default function AsgardEmbed() {
  const { section: sectionKey } = useParams()
  const { user } = useAuth()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const asgardAllowed = user?.email === ASGARD_ALLOWED_EMAIL
  const asgardNav = useAsgardNav(asgardAllowed)
  const availability = useAsgardAvailability(asgardAllowed)
  const sections = asgardNav.data ?? []
  const section = asgardSectionForKey(sectionKey, sections)
  const defaultSection = sections[0]

  // Cross-origin iframes don't receive focus until clicked, which makes the
  // first click inside the embed only focus the frame (requiring a second
  // click to actually interact). Focusing the frame's window on pointer-enter
  // and on load makes interaction seamless.
  const focusIframe = () => iframeRef.current?.contentWindow?.focus()

  if (!asgardAllowed) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlatformHeader title="Asgard" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Asgard is not available for this Cairn account.
        </div>
      </div>
    )
  }

  if (asgardNav.isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlatformHeader title="Asgard" />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading Asgard sections…
        </div>
      </div>
    )
  }

  if (asgardNav.isError || sections.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlatformHeader title="Asgard" />
        <AsgardUnavailable onRetry={() => void asgardNav.refetch()} />
      </div>
    )
  }

  if (!section && defaultSection) {
    return <Navigate to={defaultSection.cairnPath} replace />
  }

  if (!section) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PlatformHeader title="Asgard" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Unknown Asgard section.
        </div>
      </div>
    )
  }

  const iframeUrl = asgardEmbedUrl(section)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PlatformHeader
        title={`Asgard · ${section.title}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <a href={iframeUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open Asgard
            </a>
          </Button>
        }
      />

      {availability.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Checking Asgard availability…
        </div>
      ) : availability.isError || availability.data !== true ? (
        <AsgardUnavailable onRetry={() => void availability.refetch()} />
      ) : (
        <iframe
          key={iframeUrl}
          ref={iframeRef}
          src={iframeUrl}
          title={`Asgard ${section.title}`}
          className="min-h-0 flex-1 border-0 bg-background"
          referrerPolicy="strict-origin-when-cross-origin"
          onMouseEnter={focusIframe}
          onLoad={focusIframe}
        />
      )}
    </div>
  )
}
