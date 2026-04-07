'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { MailOpen, Trash2, Send, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { markMessageRead, deleteMessage, sendReply } from '../actions'
import { TipTapToolbar } from '@/components/ui/tiptap-toolbar'

interface SignalReply {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  createdAt: Date
}

interface Signal {
  id: string
  senderName: string
  senderEmail: string
  body: string
  read: boolean
  createdAt: Date
  replies: SignalReply[]
}

interface SignalsInboxProps {
  signals: Signal[]
  singularTerm: string
  pluralTerm: string
  messagesPerPage?: number
  autoMarkRead?: boolean
  initialSelectedId?: string | null
  onBack?: () => void
  showBackButton?: boolean
}

function ReplyEditor({ signalId }: { signalId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    editorProps: {
      attributes: {
        class: 'min-h-[60px] max-h-[160px] overflow-y-auto px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none',
      },
      handleKeyDown(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          handleSend()
          return true
        }
        return false
      },
    },
  })

  function handleSend() {
    const html = editor?.getHTML()
    if (!html || html === '<p></p>') return
    startTransition(async () => {
      await sendReply(signalId, html)
      editor?.commands.clearContent()
      router.refresh()
    })
  }

  return (
    <div className="border-t bg-card p-3 flex flex-col gap-2 shrink-0">
      <div className="rounded-lg border border-input bg-background overflow-hidden">
        <TipTapToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">⌘ Enter to send</span>
        <Button size="sm" onClick={handleSend} disabled={pending}>
          <Send className="h-3.5 w-3.5" />
          {pending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  )
}

export function SignalsInbox({ signals, singularTerm, pluralTerm, messagesPerPage = 25, autoMarkRead = true, initialSelectedId = null, onBack, showBackButton }: SignalsInboxProps) {
  const [selected, setSelected] = useState<string | null>(initialSelectedId)
  const [page, setPage] = useState(1)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.max(1, Math.ceil(signals.length / messagesPerPage))
  const clampedPage = Math.min(page, totalPages)
  const pageSignals = signals.slice((clampedPage - 1) * messagesPerPage, clampedPage * messagesPerPage)

  const selectedSignal = signals.find((s) => s.id === selected)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedSignal?.replies.length])

  const handleSelect = async (signal: Signal) => {
    setSelected(signal.id)
    if (autoMarkRead && !signal.read) await markMessageRead(signal.id)
  }

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-24 text-muted-foreground rounded-lg border border-border bg-card">
        <MailOpen className="h-10 w-10" />
        <p className="font-medium">No {pluralTerm.toLowerCase()} yet</p>
        <p className="text-sm">{pluralTerm} sent via your contact page will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
      {/* Left — inbox list */}
      <div className={`${selected !== null ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 shrink-0 rounded-lg border border-border bg-card overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-1">
            {showBackButton && onBack && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -ml-1" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="text-sm font-medium">
              {signals.length > 0
                ? `${signals.length} ${(signals.length === 1 ? singularTerm : pluralTerm).toLowerCase()}`
                : pluralTerm.toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {pageSignals.map((signal, i) => (
            <div key={signal.id}>
              <button
                onClick={() => handleSelect(signal)}
                className={`w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-muted transition-colors ${selected === signal.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${!signal.read ? 'font-semibold' : 'font-medium'}`}>
                    {signal.senderName}
                  </span>
                  {!signal.read && <span className="h-2 w-2 rounded-full bg-header shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{signal.body}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
                </p>
              </button>
              {i < pageSignals.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0">
            <span className="text-xs text-muted-foreground">
              {(clampedPage - 1) * messagesPerPage + 1}–{Math.min(clampedPage * messagesPerPage, signals.length)} of {signals.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={clampedPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">{clampedPage} / {totalPages}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={clampedPage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right — chat view */}
      <div className={`${selected !== null ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0 rounded-lg border border-border bg-card overflow-hidden`}>
        {selectedSignal ? (
          <>
            <div className="flex items-center gap-2 px-4 min-h-[48px] border-b border-border shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => setSelected(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium">{selectedSignal.senderName}</span>
                <a
                  href={`mailto:${selectedSignal.senderEmail}`}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {selectedSignal.senderEmail}
                </a>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={`Delete ${singularTerm.toLowerCase()}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {singularTerm.toLowerCase()}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this {singularTerm.toLowerCase()} and all replies. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        await deleteMessage(selectedSignal.id)
                        setSelected(signals.find((s) => s.id !== selectedSignal.id)?.id ?? null)
                      }}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1 items-start max-w-[70%]">
                <span className="text-xs text-muted-foreground px-1">{selectedSignal.senderName}</span>
                <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {selectedSignal.body}
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {format(new Date(selectedSignal.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>

              {selectedSignal.replies.map((reply) => {
                const isOutbound = reply.direction === 'OUTBOUND'
                return (
                  <div
                    key={reply.id}
                    className={`flex flex-col gap-1 max-w-[70%] ${isOutbound ? 'items-end self-end' : 'items-start'}`}
                  >
                    <span className="text-xs text-muted-foreground px-1">
                      {isOutbound ? 'You' : (reply.senderName ?? selectedSignal.senderName)}
                    </span>
                    {isOutbound ? (
                      <div
                        className="rounded-2xl rounded-tr-none bg-primary text-primary-foreground px-4 py-2.5 text-sm prose prose-sm max-w-none [&_*]:text-primary-foreground [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: reply.body }}
                      />
                    ) : (
                      <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                        {reply.body}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground px-1">
                      {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                )
              })}

              <div ref={chatEndRef} />
            </div>

            <ReplyEditor signalId={selectedSignal.id} />
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            Select a {singularTerm.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  )
}
