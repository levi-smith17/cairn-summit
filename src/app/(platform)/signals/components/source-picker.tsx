'use client'

import { useState, useTransition } from 'react'
import {
  Inbox,
  Send,
  Star,
  Trash2,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getMailboxes } from '@/actions/email'

export type Source =
  | { type: 'signals' }
  | { type: 'email'; accountId: string; folder: string }

interface AccountOption {
  id: string
  label: string
  emailAddress: string
}

interface SourcePickerProps {
  accounts: AccountOption[]
  value: Source
  onChange: (source: Source) => void
  signalsLabel: string
  unreadSignals: number
}

const WELL_KNOWN: { name: string; icon: typeof Inbox; label: string }[] = [
  { name: 'INBOX',               icon: Inbox,  label: 'Inbox' },
  { name: 'Sent',                icon: Send,   label: 'Sent' },
  { name: '[Gmail]/Sent Mail',   icon: Send,   label: 'Sent' },
  { name: 'Starred',             icon: Star,   label: 'Starred' },
  { name: '[Gmail]/Starred',     icon: Star,   label: 'Starred' },
  { name: 'Trash',               icon: Trash2, label: 'Trash' },
  { name: '[Gmail]/Trash',       icon: Trash2, label: 'Trash' },
  { name: 'Drafts',              icon: Mail,   label: 'Drafts' },
  { name: '[Gmail]/Drafts',      icon: Mail,   label: 'Drafts' },
]

function folderIcon(name: string) {
  return WELL_KNOWN.find(f => f.name.toLowerCase() === name.toLowerCase())?.icon ?? Inbox
}

function folderLabel(name: string) {
  return WELL_KNOWN.find(f => f.name.toLowerCase() === name.toLowerCase())?.label
    ?? name.split('/').pop()
    ?? name
}

function sourceLabel(source: Source, accounts: AccountOption[], signalsLabel: string) {
  if (source.type === 'signals') return signalsLabel
  const acct = accounts.find(a => a.id === source.accountId)
  return `${acct?.label ?? 'Email'} · ${folderLabel(source.folder)}`
}

export function SourcePicker({
  accounts,
  value,
  onChange,
  signalsLabel,
  unreadSignals,
}: SourcePickerProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [mailboxes, setMailboxes] = useState<Record<string, string[]>>({})
  const [loadingMailboxes, startLoad] = useTransition()

  function toggleExpand(accountId: string) {
    if (expanded.has(accountId)) {
      setExpanded(prev => { const s = new Set(prev); s.delete(accountId); return s })
    } else {
      setExpanded(prev => new Set([...prev, accountId]))
      if (!mailboxes[accountId]) {
        startLoad(async () => {
          const result = await getMailboxes(accountId)
          if (result.ok && result.mailboxes) {
            setMailboxes(prev => ({ ...prev, [accountId]: result.mailboxes! }))
          }
        })
      }
    }
  }

  function select(source: Source) {
    onChange(source)
    setOpen(false)
  }

  const isSignals = value.type === 'signals'
  const emailValue = value.type === 'email' ? value : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm max-w-[220px] justify-between font-normal"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {isSignals
              ? <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              : <Inbox className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">{sourceLabel(value, accounts, signalsLabel)}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-1">

        {/* Signals inbox */}
        <button
          onClick={() => select({ type: 'signals' })}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-sm transition-colors
            ${isSignals ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            {signalsLabel}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            {unreadSignals > 0 && (
              <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {unreadSignals}
              </span>
            )}
            {isSignals && <Check className="h-3.5 w-3.5" />}
          </span>
        </button>

        {accounts.length > 0 && (
          <div className="my-1 border-t border-border" />
        )}

        {/* Email accounts */}
        {accounts.map(account => {
          const isAccountActive = emailValue?.accountId === account.id
          const isExp = expanded.has(account.id)
          const folders = mailboxes[account.id] ?? ['INBOX']

          return (
            <div key={account.id}>
              {/* Account header row */}
              <button
                onClick={() => toggleExpand(account.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted transition-colors"
              >
                {isExp
                  ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate text-xs">{account.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{account.emailAddress}</div>
                </div>
                {loadingMailboxes && isExp && (
                  <Loader2 className="h-3 w-3 animate-spin shrink-0 text-muted-foreground" />
                )}
              </button>

              {/* Folder list */}
              {isExp && (
                <div className="pl-3">
                  {folders.map(folder => {
                    const Icon = folderIcon(folder)
                    const isActive = isAccountActive && emailValue?.folder === folder
                    return (
                      <button
                        key={folder}
                        onClick={() => select({ type: 'email', accountId: account.id, folder })}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-sm transition-colors
                          ${isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{folderLabel(folder)}</span>
                        {isActive && <Check className="h-3 w-3 ml-auto shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
