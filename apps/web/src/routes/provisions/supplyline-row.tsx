import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { MarkerBadge } from '@/routes/waypoints/marker-badge'
import { deleteSupplyline, toggleSupplylineActive } from '@/lib/api/supplylines'
import { InlineSupplylineForm } from './inline-supplyline-form'
import { useTerminology } from '@/contexts/terminology-context'

interface Marker {
  markerId: string
  marker: { id: string; name: string; color: string; icon?: string }
}

export interface Provision {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextRenewal: string
  url?: string
  notes?: string
  active: boolean
  markers: Marker[]
}

interface Props {
  provision: Provision
  tags: any[]
  onSaved: () => void
  onDeleted: () => void
}

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function SupplylineRow({ provision, tags, onSaved, onDeleted }: Props) {
  const { terms } = useTerminology()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const daysUntil = Math.ceil(
    (new Date(provision.nextRenewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const renewingSoon = daysUntil <= 7 && provision.active

  if (editing) {
    return (
      <InlineSupplylineForm
        provision={provision}
        tags={tags}
        onSaved={() => { setEditing(false); onSaved() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/30 group ${!provision.active ? 'opacity-50' : ''}`}>
        <Switch
          checked={provision.active}
          onCheckedChange={async (checked) => {
            await toggleSupplylineActive(provision.id, checked)
            onSaved()
          }}
          className="shrink-0 scale-75"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate">{provision.name}</span>
            {renewingSoon && (
              <Badge className="text-xs py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                {daysUntil}d
              </Badge>
            )}
            {provision.markers.map(({ marker }) => <MarkerBadge key={marker.id} marker={marker} />)}
          </div>
          <div className="text-xs text-muted-foreground">
            renews {new Date(provision.nextRenewal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium tabular-nums">{fmt(provision.amount)}</div>
          <div className="text-xs text-muted-foreground">{CYCLE_LABELS[provision.billingCycle]}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            {provision.url && (
              <DropdownMenuItem asChild>
                <a href={provision.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open link
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.supplylines.slice(0, -1).toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{provision.name}&rdquo;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { await deleteSupplyline(provision.id); onDeleted() }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
