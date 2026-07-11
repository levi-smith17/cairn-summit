import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import { useManifestRichText } from './manifest-rich-text-context'

const inlineEditorClass =
  'w-full border-0 px-0 py-1 shadow-none outline-none ring-0 prose prose-sm max-w-none text-muted-foreground dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground focus:outline-none focus:ring-0'

export function ManifestInlineRichText({
  value,
  onChange,
  placeholder,
  className,
  minHeightClassName = 'min-h-[3rem]',
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeightClassName?: string
}) {
  const { setActiveEditor } = useManifestRichText()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Write…',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(inlineEditorClass, minHeightClassName),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    onFocus: ({ editor: ed }) => {
      setActiveEditor(ed)
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    return () => {
      if (editor) setActiveEditor(null)
    }
  }, [editor, setActiveEditor])

  return (
    <div
      className={cn(
        'text-left [&_.ProseMirror]:border-0 [&_.ProseMirror]:shadow-none [&_.ProseMirror]:outline-none [&_.ProseMirror:focus]:outline-none',
        className,
      )}
      data-manifest-editor
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
