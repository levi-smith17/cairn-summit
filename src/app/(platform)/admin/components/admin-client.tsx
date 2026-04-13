'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Users, UserPlus, UserX, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { SearchInput } from '@/components/filters/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { WayfarerList, type WayfarerSummary } from './wayfarer-list'
import { WayfarerForm } from './wayfarer-form'
import { InvitationsPanel, type InvitationSummary } from './invitations-panel'
import { ActivityPanel, type ActivityEntry } from './activity-panel'
import { bulkUpdateWayfarers, bulkDeleteWayfarers } from '@/actions/admin'

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
  initialId: string | null
  invitations: InvitationSummary[]
  invitationTokens: Record<string, string>
  activities: ActivityEntry[]
}

export function AdminClient({
  wayfarers,
  summary,
  currentUserId,
  initialId,
  invitations,
  invitationTokens,
  activities,
}: AdminClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get('tab') as Tab | null
  const activeTab: Tab = tabParam === 'invitations' || tabParam === 'activity' ? tabParam : 'wayfarers'
  const selectedId = activeTab === 'wayfarers' ? (searchParams.get('id') ?? initialId) : null

  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState<RoleFilter>('all')
  const [listedFilter, setListedFilter] = useState<ListedFilter>('all')
  const [sort, setSort]                 = useState<SortOption>('newest')
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulking, startBulk] = useTransition()

  const showRightPanel = selectedId !== null
  const selectedWayfarer = wayfarers.find(w => w.id === selectedId) ?? null

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('id')
    router.push(`?${params.toString()}`, { scroll: false })
    setSelectedBulk(new Set())
  }

  function selectWayfarer(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function showNew() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', 'new')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function toggleBulk(id: string) {
    setSelectedBulk(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAllBulk() {
    if (filtered.every(w => selectedBulk.has(w.id))) {
      setSelectedBulk(new Set())
    } else {
      setSelectedBulk(new Set(filtered.map(w => w.id)))
    }
  }

  const hasActiveFilters = search !== '' || roleFilter !== 'all' || listedFilter !== 'all'

  const filtered = wayfarers
    .filter(w => {
      if (roleFilter === 'admins' && !w.isAdmin) return false
      if (roleFilter === 'members' && w.isAdmin) return false
      if (listedFilter === 'listed' && !w.listed) return false
      if (listedFilter === 'unlisted' && w.listed) return false
      if (search) {
        const q = search.toLowerCase()
        if (!w.name?.toLowerCase().includes(q) && !w.email?.toLowerCase().includes(q) && !w.username?.toLowerCase().includes(q)) return false
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
      await bulkUpdateWayfarers(ids, { listed })
      setSelectedBulk(new Set())
      router.refresh()
    })
  }

  function handleBulkDelete() {
    const ids = [...selectedBulk]
    startBulk(async () => {
      await bulkDeleteWayfarers(ids)
      setSelectedBulk(new Set())
      setBulkDeleteOpen(false)
      router.refresh()
    })
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'wayfarers',   label: 'Wayfarers' },
    { value: 'invitations', label: 'Invitations' },
    { value: 'activity',    label: 'Activity' },
  ]

  return (
    <>
      <PlatformHeader title="Admin" />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">

        {/* Summary panels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />Total Wayfarers
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />New This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold">{summary.newThisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />Admins
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold">{summary.admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserX className="h-3.5 w-3.5" />Unlisted
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold">{summary.unlisted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab bar + filter bar */}
        <div className="rounded-lg border border-border bg-card p-2 shrink-0 space-y-2">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === t.value
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {t.label}
                {t.value === 'invitations' && invitations.filter(i => !i.usedAt && new Date() <= new Date(i.expiresAt)).length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {invitations.filter(i => !i.usedAt && new Date() <= new Date(i.expiresAt)).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filter bar — only for wayfarers tab */}
          {activeTab === 'wayfarers' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <SearchInput value={search} onChange={setSearch} placeholder="Search wayfarers…" />
              <Select value={roleFilter} onValueChange={v => setRoleFilter(v as RoleFilter)}>
                <SelectTrigger className="h-8 w-auto text-sm gap-1.5 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admins">Admins only</SelectItem>
                  <SelectItem value="members">Members only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={listedFilter} onValueChange={v => setListedFilter(v as ListedFilter)}>
                <SelectTrigger className="h-8 w-auto text-sm gap-1.5 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All visibility</SelectItem>
                  <SelectItem value="listed">Listed only</SelectItem>
                  <SelectItem value="unlisted">Unlisted only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
                <SelectTrigger className="h-8 w-auto text-sm gap-1.5 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                  <SelectItem value="name-desc">Name Z–A</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-sm"
                  onClick={() => { setSearch(''); setRoleFilter('all'); setListedFilter('all') }}>
                  <X className="h-3.5 w-3.5" />Clear
                </Button>
              )}
            </div>
          )}

        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {activeTab === 'wayfarers' && (
            <>
              {/* Left — wayfarer list */}
              <div className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
                <WayfarerList
                  wayfarers={filtered}
                  selectedId={selectedId}
                  currentUserId={currentUserId}
                  selectedBulk={selectedBulk}
                  bulking={bulking}
                  onSelect={selectWayfarer}
                  onNew={showNew}
                  onToggleBulk={toggleBulk}
                  onToggleAllBulk={toggleAllBulk}
                  onBulkMarkListed={handleBulkMarkListed}
                  onBulkDelete={() => setBulkDeleteOpen(true)}
                  onBulkClear={() => setSelectedBulk(new Set())}
                />
              </div>

              {/* Right — form */}
              <div className={`${showRightPanel ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
                {selectedId ? (
                  <WayfarerForm
                    key={selectedId}
                    wayfarer={selectedId === 'new' ? null : selectedWayfarer}
                    currentUserId={currentUserId}
                    onBack={clearSelection}
                    onSaved={selectWayfarer}
                    onDeleted={clearSelection}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a wayfarer to edit, or{' '}
                      <button onClick={showNew} className="text-primary hover:underline">add a new one</button>.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'invitations' && (
            <div className="flex flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden">
              <InvitationsPanel invitations={invitations} tokens={invitationTokens} />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="flex flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden">
              <ActivityPanel activities={activities} />
            </div>
          )}
        </div>
      </div>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedBulk.size} wayfarers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedBulk.size} wayfarer{selectedBulk.size !== 1 ? 's' : ''} and all their data.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
