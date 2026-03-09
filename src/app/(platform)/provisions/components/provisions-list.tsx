'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ExternalLink, Pencil, Trash2, Search } from 'lucide-react'
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { ProvisionDrawer } from '@/components/drawers/provision-drawer'
import { deleteProvision, toggleProvisionActive } from '@/actions/provisions'

interface Tag {
  tagId: string
  tag: { id: string; name: string; color: string; icon?: string }
}

interface Provision {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextRenewal: string
  category: string
  url?: string
  notes?: string
  active: boolean
  tags: Tag[]
}

interface Props {
  refreshKey: number
  onRefresh: () => void
}

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
}

export default function ProvisionsList({ refreshKey, onRefresh }: Props) {
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Provision | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/provisions/categories').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
    ]).then(([catData, tagData]) => {
      setCategories(catData.categories)
      setTags(tagData.tags)
    })
  }, [refreshKey])

  useEffect(() => {
    const fetchProvisions = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (activeFilter !== 'all') params.set('active', activeFilter)
      try {
        const res = await fetch(`/api/provisions?${params}`)
        const data = await res.json()
        setProvisions(data.provisions)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProvisions()
  }, [search, categoryFilter, activeFilter, refreshKey])

  function handleEdit(provision: Provision) {
    setEditTarget(provision)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditTarget(null)
    onRefresh()
  }

  async function handleToggleActive(provision: Provision) {
    await toggleProvisionActive(provision.id, !provision.active)
    onRefresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this subscription?')) return
    await deleteProvision(id)
    onRefresh()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : provisions.length === 0 ? (
        <div className="text-muted-foreground text-sm">No subscriptions found.</div>
      ) : (
        <div className="space-y-3">
          {provisions.map((p) => {
            const daysUntil = Math.ceil(
              (new Date(p.nextRenewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const renewingSoon = daysUntil <= 7 && p.active
            return (
              <Card key={p.id} className={!p.active ? 'opacity-60' : ''}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{p.name}</span>
                      <Badge variant="secondary">{p.category}</Badge>
                      <Badge variant="outline">{CYCLE_LABELS[p.billingCycle]}</Badge>
                      {renewingSoon && (
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                          Renews in {daysUntil}d
                        </Badge>
                      )}
                      {p.tags.map(({ tag }) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Next renewal: {new Date(p.nextRenewal).toLocaleDateString()}
                      {p.notes && <span className="ml-3">{p.notes}</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-semibold">{fmt(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {CYCLE_LABELS[p.billingCycle].toLowerCase()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={p.active}
                      onCheckedChange={() => handleToggleActive(p)}
                    />
                    {p.url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ProvisionDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        provision={editTarget}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}