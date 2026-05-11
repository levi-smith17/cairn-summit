import { useState, useTransition } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from '@/components/ui/button'
import { CheckCircle, Send } from 'lucide-react'
import { TipTapToolbar } from '@/components/ui/tiptap-toolbar'
import { sendThreadReply } from '@/lib/api/thread'

interface ThreadFormProps {
  token: string
  wayfarerName: string | null
}

export function ThreadForm({ token, wayfarerName }: ThreadFormProps) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
        class: 'min-h-[120px] px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none',
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
    const html = editor?.getHTML() ?? ''
    if (!html || html === '<p></p>') return
    setError(null)
    startTransition(async () => {
      const result = await sendThreadReply(token, html)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-10 w-10 text-header" />
        <div>
          <p className="font-medium">Reply sent</p>
          <p className="text-sm text-muted-foreground mt-1">
            {wayfarerName ?? 'They'} will see your reply shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-input bg-background overflow-hidden">
        <TipTapToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">⌘ Enter to send</span>
        <Button onClick={handleSend} disabled={pending}>
          <Send className="h-4 w-4" />
          {pending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </div>
  )
}
