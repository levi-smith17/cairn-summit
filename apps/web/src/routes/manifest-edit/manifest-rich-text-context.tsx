import { createContext, useContext, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { RichEditorToolbar } from '@/components/ui/rich-editor-toolbar'

type ManifestRichTextContextValue = {
  setActiveEditor: (editor: Editor | null) => void
}

const ManifestRichTextContext = createContext<ManifestRichTextContextValue | null>(null)

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
          <RichEditorToolbar editor={activeEditor} />
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
