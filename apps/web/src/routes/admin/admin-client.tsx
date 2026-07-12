import { useState, useTransition } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpDown, Eye, Plus, Shield, Users, UserPlus, UserX, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { ContextTabButton } from '@/components/studio/ui/context-tab'
import { FilterInput } from '@/components/ui/filter-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import { WayfarerList } from './wayfarer-list'
import { WayfarerForm } from './wayfarer-form'
import { InvitationsPanel } from './invitations-panel'
import { ActivityPanel } from './activity-panel'
import { bulkUpdateWayfarers, bulkDeleteWayfarers } from '@/lib/api/admin'
import { useTerminology } from '@/contexts/terminology-context'
import type { WayfarerSummary, InvitationSummary, ActivityEntry } from '@/lib/api/admin'

interface Summary {
  total: number
  newThisMonth: number
  admins: number
  unlisted: number
}

type Tab = 'wayfarers' | 'invitations' | 'activity'
type RoleFilter = 'all' | 'admins' | 'members'
type ListedFilter = 'all' | 'listed' | 'unlisted'
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

interface AdminClientProps {
  wayfarers: WayfarerSummary[]
  summary: Summary
  currentUserId: string
  invitations: InvitationSummary[]
  activities: ActivityEntry[]
  onRefresh: () => void
}

function AdminTabs({
  activeTab,
  invitations,
  wayfarersLabel,
  onTabChange,
}: {
  activeTab: Tab
  invitations: InvitationSummary[]
  wayfarersLabel: string
  onTabChange: (tab: Tab) => void
}) {
  const activeInviteCount = invitations.filter(
    (i) => !i.usedAt && new Date() <= new Date(i.expiresAt),
  ).length

  const tabs: { value: Tab; label: string; badge?: number }[] = [
    { value: 'wayfarers', label: wayfarersLabel },
    { value: 'invitations', label: 'Invitations', badge: activeInviteCount || undefined },
    { value: 'activity', label: 'Activity' },
  ]

  return (
    <nav
      className="flex h-full min-w-0 items-stretch justify-center gap-0.5 px-1 lg:px-0"
      aria-label="Admin sections"
    >
      {tabs.map((tab) => {
        const active = tab.value === activeTab
        return (
          <ContextTabButton
            key={tab.value}
            type="button"
            active={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.label}
            {tab.badge ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                {tab.badge}
              </span>
            ) : null}
          </ContextTabButton>
        )
      })}
    </nav>
  )
}

function AdminSnapshot({ summary, wayfarersLabel }: { summary: Summary; wayfarersLabel: string }) {
  const cards = [
    { icon: Users, label: `Total ${wayfarersLabel}`, value: summary.total },
    { icon: UserPlus, label: 'New This Month', value: summary.newThisMonth },
    { icon: Shield, label: 'Admins', value: summary.admins },
    { icon: UserX, label: 'Unlisted', value: summary.unlisted },
  ]

  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-border p-4 md:grid-cols-4">
      {cards.map(({ icon: Icon, label, value }) => (
        <Card key={label}>
          <CardHeader className="px-4 pb-1 pt-3">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AdminClient({
  wayfarers,
  summary,
  currentUserId,
  invitations,
  activities,
  onRefresh,
}: AdminClientProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { terms } = useTerminology()

  const tabParam = searchParams.get('tab') as Tab | null
  const activeTab: Tab =
    tabParam === 'invitations' || tabParam === 'activity' ? tabParam : 'wayfarers'
  const selectedId = activeTab === 'wayfarers' ? (searchParams.get('id') ?? null) : null

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [listedFilter, setListedFilter] = useState<ListedFilter>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulking, startBulk] = useTransition()

  const selectedWayfarer = wayfarers.find((w) => w.id === selectedId) ?? null
  const singularWayfarer = terms.wayfarers.endsWith('s')
    ? terms.wayfarers.slice(0, -1)
    : terms.wayfarers

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('id')
    setSearchParams(params, { preventScrollReset: true })
    setSelectedBulk(new Set())
  }

  function selectWayfarer(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    setSearchParams(params, { preventScrollReset: true })
  }

  function showNew() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', 'new')
    setSearchParams(params, { preventScrollReset: true })
  }

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    setSearchParams(params, { preventScrollReset: true })
  }

  function toggleBulk(id: string) {
    setSelectedBulk((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAllBulk() {
    if (filtered.every((w) => selectedBulk.has(w.id))) {
      setSelectedBulk(new Set())
    } else {
      setSelectedBulk(new Set(filtered.map((w) => w.id)))
    }
  }

  const hasActiveFilters = search !== '' || roleFilter !== 'all' || listedFilter !== 'all'

  const filtered = wayfarers
    .filter((w) => {
      if (roleFilter === 'admins' && !w.isAdmin) return false
      if (roleFilter === 'members' && w.isAdmin) return false
      if (listedFilter === 'listed' && !w.listed) return false
      if (listedFilter === 'unlisted' && w.listed) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !w.name?.toLowerCase().includes(q) &&
          !w.email?.toLowerCase().includes(q) &&
          !w.username?.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === 'name-asc') return (a.name ?? a.email ?? '').localeCompare(b.name ?? b.email ?? '')
      return (b.name ?? b.email ?? '').localeCompare(a.name ?? a.email ?? '')
    })

  function handleBulkMarkListed(listed: boolean) {
    const ids = [...selectedBulk]
    startBulk(async () => {
      await bulkUpdateWayfarers(ids, listed)
      setSelectedBulk(new Set())
      onRefresh()
    })
  }

  function handleBulkDelete() {
    const ids = [...selectedBulk]
    startBulk(async () => {
      await bulkDeleteWayfarers(ids)
      setSelectedBulk(new Set())
      setBulkDeleteOpen(false)
      onRefresh()
    })
  }

  const allSelected = filtered.length > 0 && filtered.every((w) => selectedBulk.has(w.id))

  const rail =
    activeTab === 'wayfarers' ? (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <div className="flex min-w-0 items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAllBulk}
              aria-label="Select all"
              className="shrink-0"
            />
            <span className="truncate text-sm font-semibold text-foreground">
              {`${filtered.length} ${filtered.length === 1 ? singularWayfarer : terms.wayfarers}`.toLowerCase()}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={showNew}
                aria-label={`Add ${singularWayfarer.toLowerCase()}`}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add {singularWayfarer.toLowerCase()}</TooltipContent>
          </Tooltip>
        </div>

        <div className="shrink-0 space-y-2 border-b border-border px-3 py-2">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="Filter"
            className="w-full"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <CustomSelect
              options={[
                { value: 'all', label: 'All roles' },
                { value: 'admins', label: 'Admins only' },
                { value: 'members', label: 'Members only' },
              ]}
              value={roleFilter}
              onChange={(v) => setRoleFilter(v as RoleFilter)}
              icon={Shield}
              placeholderValue="all"
              triggerClassName="min-w-0 flex-1 basis-[calc(50%-0.2rem)]"
            />
            <CustomSelect
              options={[
                { value: 'all', label: 'All visibility' },
                { value: 'listed', label: 'Listed only' },
                { value: 'unlisted', label: 'Unlisted only' },
              ]}
              value={listedFilter}
              onChange={(v) => setListedFilter(v as ListedFilter)}
              icon={Eye}
              placeholderValue="all"
              triggerClassName="min-w-0 flex-1 basis-[calc(50%-0.2rem)]"
            />
            <CustomSelect
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'name-asc', label: 'Name A–Z' },
                { value: 'name-desc', label: 'Name Z–A' },
              ]}
              value={sort}
              onChange={(v) => setSort(v as SortOption)}
              icon={ArrowUpDown}
              placeholderValue="newest"
              triggerClassName="min-w-0 flex-1"
            />
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 text-sm"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                  setListedFilter('all')
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <WayfarerList
            wayfarers={filtered}
            selectedId={selectedId}
            currentUserId={currentUserId}
            selectedBulk={selectedBulk}
            bulking={bulking}
            onSelect={selectWayfarer}
            onToggleBulk={toggleBulk}
            onBulkMarkListed={handleBulkMarkListed}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onBulkClear={() => setSelectedBulk(new Set())}
          />
        </div>
      </div>
    ) : undefined

  let canvasBody: React.ReactNode
  if (activeTab === 'invitations') {
    canvasBody = (
      <div className="min-h-0 flex-1 overflow-hidden">
        <InvitationsPanel invitations={invitations} onRefresh={onRefresh} />
      </div>
    )
  } else if (activeTab === 'activity') {
    canvasBody = (
      <div className="min-h-0 flex-1 overflow-hidden">
        <ActivityPanel activities={activities} />
      </div>
    )
  } else if (selectedId) {
    canvasBody = (
      <div className="min-h-0 flex-1 overflow-hidden">
        <WayfarerForm
          key={selectedId}
          wayfarer={selectedId === 'new' ? null : selectedWayfarer}
          currentUserId={currentUserId}
          onBack={clearSelection}
          onSaved={selectWayfarer}
          onDeleted={clearSelection}
          onRefresh={onRefresh}
        />
      </div>
    )
  } else {
    canvasBody = (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Select a {singularWayfarer.toLowerCase()} to edit, or{' '}
          <button type="button" onClick={showNew} className="text-primary hover:underline">
            add a new one
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <>
      <StudioLayout
        railLabel={terms.wayfarers}
        contextBar={
          <PlatformStudioContextBar
            aria-label="Admin header"
            title="Admin"
            tabs={
              <AdminTabs
                activeTab={activeTab}
                invitations={invitations}
                wayfarersLabel={terms.wayfarers}
                onTabChange={setTab}
              />
            }
          />
        }
        rail={rail}
        canvas={
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <AdminSnapshot summary={summary} wayfarersLabel={terms.wayfarers} />
            {canvasBody}
          </div>
        }
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedBulk.size} wayfarers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedBulk.size} wayfarer
              {selectedBulk.size !== 1 ? 's' : ''} and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
