import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Bold, Heading2, Italic, List, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ManifestRichTextContextValue = {
  setActiveEditor: (editor: Editor | null) => void
}

const ManifestRichTextContext = createContext<ManifestRichTextContextValue | null>(null)

function ManifestRichTextToolbar({ editor }: { editor: Editor | null }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!editor) return
    const update = () => setTick((n) => n + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const disabled = !editor
  const btn = (active: boolean) => cn('h-7 w-7', active && 'bg-muted')

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-0.5', disabled && 'opacity-50')}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={btn(editor?.isActive('heading', { level: 2 }) ?? false)}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={btn(editor?.isActive('bold') ?? false)}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={btn(editor?.isActive('italic') ?? false)}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={btn(editor?.isActive('bulletList') ?? false)}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={btn(editor?.isActive('orderedList') ?? false)}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function ManifestRichTextProvider({ children }: { children: React.ReactNode }) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)

  const value = useMemo(
    () => ({
      setActiveEditor,
    }),
    [],
  )

  return (
    <ManifestRichTextContext.Provider value={value}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-center overflow-hidden border-b border-border bg-muted/20 px-3">
          <ManifestRichTextToolbar editor={activeEditor} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </ManifestRichTextContext.Provider>
  )
}

export function useManifestRichText() {
  const context = useContext(ManifestRichTextContext)
  if (!context) {
    throw new Error('useManifestRichText must be used within ManifestRichTextProvider')
  }
  return context
}
