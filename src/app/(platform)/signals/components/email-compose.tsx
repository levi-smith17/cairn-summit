'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Send, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TipTapToolbar } from '@/components/ui/tiptap-toolbar'
import { sendEmailAction } from '@/actions/email'

interface EmailComposeProps {
  accountId: string
  fromAddress: string
  mode: 'new' | 'reply' | 'forward'
  singularTerm?: string
  replyTo?: string
  replySubject?: string
  replyMessageId?: string | null
  replyBodyHtml?: string | null
  onClose: () => void
  onSent?: () => void
}

export function EmailCompose({
  accountId,
  fromAddress,
  mode,
  singularTerm = 'Message',
  replyTo = '',
  replySubject = '',
  replyMessageId,
  replyBodyHtml,
  onClose,
  onSent,
}: EmailComposeProps) {
  const [to, setTo]           = useState(mode === 'reply' ? replyTo : '')
  const [cc, setCc]           = useState('')
  const [bcc, setBcc]         = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [subject, setSubject] = useState(
    mode === 'reply'
      ? (replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`)
      : mode === 'forward'
        ? (replySubject.startsWith('Fwd:') ? replySubject : `Fwd: ${replySubject}`)
        : '',
  )
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const quoteHtml = (mode === 'reply' || mode === 'forward') && replyBodyHtml
    ? `<br/><blockquote style="border-left:2px solid #ccc;margin:0;padding-left:1em;color:#666">${replyBodyHtml}</blockquote>`
    : ''

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: quoteHtml,
    editorProps: {
      attributes: {
        // No height caps — the editor div fills its flex container
        class: 'h-full px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none',
      },
    },
  })

  async function handleSend() {
    const html = editor?.getHTML()
    if (!html || html === '<p></p>' || !to.trim()) return
    setSending(true)
    setError(null)

    const toList  = to.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    const ccList  = cc.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    const bccList = bcc.split(/[,;]/).map(s => s.trim()).filter(Boolean)

    const result = await sendEmailAction({
      accountId,
      to: toList,
      cc:  ccList.length  > 0 ? ccList  : undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject,
      html,
      inReplyTo:  replyMessageId ?? null,
      references: replyMessageId ?? null,
    })

    setSending(false)
    if (result.ok) {
      onSent?.()
      onClose()
    } else {
      setError(result.error ?? 'Failed to send')
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {mode === 'new' ? `New ${singularTerm}` : mode === 'reply' ? 'Reply' : 'Forward'}
        </span>
      </div>

      {/* Address / subject fields */}
      <div className="flex flex-col divide-y border-b shrink-0">
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xs text-muted-foreground w-12 shrink-0">From</span>
          <span className="text-sm text-muted-foreground">{fromAddress}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xs text-muted-foreground w-12 shrink-0">To</span>
          <Input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="border-0 p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2 text-muted-foreground shrink-0"
            onClick={() => setShowCcBcc(v => !v)}
          >
            Cc/Bcc <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
        {showCcBcc && (
          <>
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">Cc</span>
              <Input
                value={cc}
                onChange={e => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="border-0 p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">Bcc</span>
              <Input
                value={bcc}
                onChange={e => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="border-0 p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
              />
            </div>
          </>
        )}
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xs text-muted-foreground w-12 shrink-0">Subject</span>
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="border-0 p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
          />
        </div>
      </div>

      {/* Body — fills remaining space */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <TipTapToolbar editor={editor} />
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      {/* Footer — Cancel on left, Send on right */}
      <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0">
        <span className="text-xs text-muted-foreground">⌘ Enter to send</span>
        <div className="flex-1" />
        {error && <span className="text-xs text-destructive">{error}</span>}
        <Button size="sm" variant="ghost" onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSend} disabled={sending || !to.trim()}>
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
