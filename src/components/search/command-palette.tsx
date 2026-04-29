'use client'

import { useEffect, useRef, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, AlignLeft, Bookmark, NotebookPen, Wallet, CalendarDays,
  Folder, Tag, Zap, Clock,
} from 'lucide-react'
import { globalSearch, type SearchResult, type SearchResultType } from '@/actions/search'

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<SearchResultType, {
  label: string
  Icon: React.ElementType
  bg: string
  text: string
}> = {
  waypoint:  { label: 'Waypoint',  Icon: Bookmark,     bg: 'bg-blue-500/15',   text: 'text-blue-600 dark:text-blue-400' },
  log:       { label: 'Log',       Icon: NotebookPen,  bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' },
  provision: { label: 'Provision', Icon: Wallet,       bg: 'bg-green-500/15',  text: 'text-green-600 dark:text-green-400' },
  stop:      { label: 'Stop',      Icon: CalendarDays, bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  trail:     { label: 'Trail',     Icon: Folder,       bg: 'bg-slate-500/15',  text: 'text-slate-600 dark:text-slate-400' },
  marker:    { label: 'Marker',    Icon: Tag,          bg: 'bg-slate-500/15',  text: 'text-slate-600 dark:text-slate-400' },
  signal:    { label: 'Signal',    Icon: Zap,          bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400' },
}

const RECENT_KEY = 'cairn:recent-search'
const RECENT_MAX = 8
const INITIAL_SHOW = 15

type StoredResult = Omit<SearchResult, 'score'>

function loadRecents(): StoredResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(result: SearchResult) {
  try {
    const prev = loadRecents().filter(r => !(r.id === result.id && r.type === result.type))
    const { score: _, ...stored } = result
    const next = [stored, ...prev].slice(0, RECENT_MAX)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({
  result,
  active,
  onClick,
  onMouseEnter,
}: {
  result: SearchResult | StoredResult
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
}) {
  const meta = TYPE_META[result.type]
  const { Icon } = meta

  return (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
        active ? 'bg-muted' : 'hover:bg-muted/50'
      }`}
    >
      {/* Type icon */}
      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${meta.bg}`}>
        {result.type === 'marker' && result.color ? (
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: result.color }} />
        ) : (
          <Icon className={`h-3.5 w-3.5 ${meta.text}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
      </div>

      {/* Type pill */}
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${meta.bg} ${meta.text}`}>
        {meta.label}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  openInNewTab: boolean
}

export function CommandPalette({ openInNewTab }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [deep, setDeep] = useState(false)
  const [googleMode, setGoogleMode] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [recents, setRecents] = useState<StoredResult[]>([])
  const [pending, startSearch] = useTransition()

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recents when palette opens
  useEffect(() => {
    if (open) {
      setRecents(loadRecents())
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      setShowAll(false)
      setGoogleMode(false)
    }
  }, [open])

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Custom event trigger from sidebar button
  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener('cairn:open-search', onOpen)
    return () => window.removeEventListener('cairn:open-search', onOpen)
  }, [])

  // Debounced search — suppressed in Google mode
  useEffect(() => {
    if (googleMode) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setActiveIndex(0)
      setShowAll(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const res = await globalSearch(query, deep)
        setResults(res)
        setActiveIndex(0)
        setShowAll(false)
      })
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, deep, googleMode])

  const navigate = useCallback((result: SearchResult | StoredResult) => {
    saveRecent(result as SearchResult)
    setOpen(false)

    if (result.type === 'waypoint' && openInNewTab && result.externalUrl) {
      window.open(result.externalUrl, '_blank', 'noopener,noreferrer')
    } else {
      router.push(result.url)
    }
  }, [openInNewTab, router])

  const displayItems: (SearchResult | StoredResult)[] = query.trim()
    ? (showAll ? results : results.slice(0, INITIAL_SHOW))
    : recents

  const hasMore = query.trim() && !showAll && results.length > INITIAL_SHOW

  // Keyboard navigation within results + Google mode toggle
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        setGoogleMode(v => !v)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!googleMode) setActiveIndex(i => Math.min(i + 1, displayItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!googleMode) setActiveIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (googleMode) {
          if (query.trim()) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank', 'noopener,noreferrer')
            setOpen(false)
          }
        } else if (displayItems[activeIndex]) {
          navigate(displayItems[activeIndex] as SearchResult)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, displayItems, activeIndex, googleMode, query, navigate])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-border bg-background shadow-2xl overflow-hidden">

        {/* Search bar */}
        <div className={`flex items-center gap-2 px-4 py-3 border-b transition-colors ${googleMode ? 'border-blue-500/40 bg-blue-500/5' : 'border-border'}`}>
          <Search className={`h-4 w-4 shrink-0 transition-colors ${googleMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={googleMode ? 'Search Google…' : 'Search everything…'}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {/* Google mode badge */}
          {googleMode && (
            <span className="flex items-center px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 select-none">
              Google
            </span>
          )}
          {/* Deep search toggle — hidden in Google mode */}
          {!googleMode && (
            <button
              onClick={() => setDeep(v => !v)}
              title={deep ? 'Deep search on — searching body text' : 'Deep search off — title only'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                deep
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Deep
            </button>
          )}
          {/* Close */}
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-[420px]">

          {/* Google mode state */}
          {googleMode && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4 gap-2">
              {query.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Press <kbd className="font-mono px-1 py-0.5 rounded bg-muted text-xs">↵</kbd> to search Google for <strong>&quot;{query}&quot;</strong>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Type to search Google…</p>
              )}
            </div>
          )}

          {!googleMode && !query.trim() && recents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Type to search across all your content.</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">
                Waypoints, logs, stops, provisions, signals, and more.
              </p>
            </div>
          )}

          {!googleMode && !query.trim() && recents.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-4 py-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recent</span>
              </div>
              {recents.map((r, i) => (
                <ResultRow
                  key={`${r.type}:${r.id}`}
                  result={r}
                  active={activeIndex === i}
                  onClick={() => navigate(r as SearchResult)}
                  onMouseEnter={() => setActiveIndex(i)}
                />
              ))}
            </>
          )}

          {!googleMode && query.trim() && pending && (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!googleMode && query.trim() && !pending && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <p className="text-sm text-muted-foreground">No results for <strong>&quot;{query}&quot;</strong>.</p>
              {!deep && (
                <button
                  onClick={() => setDeep(true)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Try deep search to include body text
                </button>
              )}
            </div>
          )}

          {!googleMode && query.trim() && !pending && displayItems.map((r, i) => (
            <ResultRow
              key={`${r.type}:${r.id}`}
              result={r}
              active={activeIndex === i}
              onClick={() => navigate(r as SearchResult)}
              onMouseEnter={() => setActiveIndex(i)}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-center border-t border-border/50"
            >
              Show {results.length - INITIAL_SHOW} more results
            </button>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border/50 text-[12px] text-muted-foreground/60">
          {googleMode ? (
            <>
              <span><kbd className="font-mono">↵</kbd> search</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
              <span className="ml-auto text-blue-500/70"><kbd className="font-mono">⌘G</kbd> back to app</span>
              <span><kbd className="font-mono">⌘K</kbd> toggle</span>
            </>
          ) : (
            <>
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
              <span className="ml-auto"><kbd className="font-mono">⌘G</kbd> Google</span>
              <span><kbd className="font-mono">⌘K</kbd> toggle</span>
            </>
          )}
        </div>
      </div>
    </>
  )
}
