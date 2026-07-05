import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  createApiToken,
  getApiTokenStatus,
  revokeApiToken,
} from '@/lib/api/settings'
import { useQuery } from '@tanstack/react-query'

export function IntegrationsForm() {
  const queryClient = useQueryClient()
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusQuery = useQuery({
    queryKey: ['settings', 'api-token'],
    queryFn: getApiTokenStatus,
  })

  const status = statusQuery.data

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    try {
      const result = await createApiToken()
      setGeneratedToken(result.token)
      await queryClient.invalidateQueries({ queryKey: ['settings', 'api-token'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke() {
    setBusy(true)
    setError(null)
    try {
      await revokeApiToken()
      setGeneratedToken(null)
      setRevokeOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['settings', 'api-token'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token')
    } finally {
      setBusy(false)
    }
  }

  async function copyToken() {
    if (!generatedToken) return
    await navigator.clipboard.writeText(generatedToken)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Personal API tokens let trusted apps (like your private Asgard dashboard) access Cairn
          Summit on your behalf.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Personal API token</p>
            {statusQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking token status…</p>
            ) : status?.configured ? (
              <p className="text-sm text-muted-foreground">
                Active token prefix <code>{status.tokenPrefix}</code>
                {status.lastUsedAt ? ` · last used ${new Date(status.lastUsedAt).toLocaleString()}` : ''}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No active token.</p>
            )}
          </div>
        </div>

        {generatedToken ? (
          <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm font-medium text-foreground">Copy this token now</p>
            <p className="text-xs text-muted-foreground">
              This is the only time the full token is shown. Store it in Asgard SSM as
              {' '}<code>/asgard/cairn/api-token</code>.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">{generatedToken}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => void copyToken()}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleGenerate()} disabled={busy}>
            {status?.configured ? 'Rotate token' : 'Generate token'}
          </Button>
          {status?.configured ? (
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRevokeOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Revoke
            </Button>
          ) : null}
        </div>
      </div>

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API token?</AlertDialogTitle>
            <AlertDialogDescription>
              Apps using this token (including Asgard) will lose access until you generate a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void handleRevoke()} disabled={busy}>
              Revoke token
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
