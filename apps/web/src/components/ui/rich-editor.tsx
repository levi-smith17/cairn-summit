'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, ListOrdered,
  Quote, Code, Code2, Minus, Heading1, Heading2, Heading3,
  Table2, TableRowsSplit, Columns2, Trash2, ImageIcon, Loader2, Sun, Moon, Monitor, Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ColorScheme = 'auto' | 'light' | 'dark'
export type FontSize = 'sm' | 'base' | 'lg' | 'xl'

const fontSizeLabels: Record<FontSize, string> = { sm: 'S', base: 'M', lg: 'L', xl: 'XL' }
const fontSizeOrder: FontSize[] = ['sm', 'base', 'lg', 'xl']

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Fill available height — editor scrolls internally. Use in full-height contexts (logbook). */
  fullHeight?: boolean
  /** Show the color scheme toggle button in the toolbar. */
  showColorToggle?: boolean
  /** Show the font size selector in the toolbar (presentation only, not saved). */
  showFontSizeToggle?: boolean
  /** When provided, the image popover shows a file upload option. */
  onImageUpload?: (file: File) => Promise<string>
  /** Controlled font size — provide with onFontSizeChange to persist across remounts. */
  fontSize?: FontSize
  onFontSizeChange?: (size: FontSize) => void
}

// Static lookup — full literal strings are required so Tailwind's scanner
// includes all four prose size variants in the CSS bundle.
const fontSizeProseClass: Record<FontSize, string> = {
  sm:   'prose-sm',
  base: '',
  lg:   'prose-lg',
  xl:   'prose-xl',
}

function buildEditorClass(scheme: ColorScheme, fontSize: FontSize = 'sm') {
  const sizeClass = fontSizeProseClass[fontSize]
  const base = ['w-full px-6 py-4 outline-none prose', sizeClass, 'max-w-none prose-headings:font-semibold prose-p:leading-relaxed']
    .filter(Boolean).join(' ')
  if (scheme === 'dark') return `${base} prose-invert`
  if (scheme === 'light') return base
  return `${base} dark:prose-invert`
}

// ── Image URL popover ──────────────────────────────────────────────────────────
function ImagePopover({
  onInsert,
  onUpload,
}: {
  onInsert: (src: string, alt: string) => void
  onUpload?: (file: File) => Promise<string>
}) {
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleInsert() {
    if (!src.trim()) return
    onInsert(src.trim(), alt.trim())
    setSrc('')
    setAlt('')
    setOpen(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    setUploading(true)
    try {
      const url = await onUpload(file)
      onInsert(url, file.name.replace(/\.[^.]+$/, ''))
      setOpen(false)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Insert image">
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" sideOffset={6}>
        <p className="text-xs font-medium mb-2">Insert image</p>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Image URL"
            value={src}
            onChange={e => setSrc(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleInsert() } }}
            autoFocus
          />
          <Input
            placeholder="Alt text (optional)"
            value={alt}
            onChange={e => setAlt(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleInsert() } }}
          />
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs"
            onClick={handleInsert}
            disabled={!src.trim()}
          >
            Insert
          </Button>

          {onUpload && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Upload className="h-3 w-3" />
                }
                {uploading ? 'Uploading…' : 'Upload from device'}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Table popover (insert + context actions) ──────────────────────────────────
function TablePopover({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false)

  if (!editor) return null
  const inTable = editor.isActive('table')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', inTable && 'bg-muted')}
          title="Table"
        >
          <Table2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" sideOffset={6}>
        {!inTable ? (
          <button
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/60 transition-colors"
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              setOpen(false)
            }}
          >
            <Table2 className="h-3.5 w-3.5 shrink-0" />
            Insert 3×3 table
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/60 transition-colors"
              onClick={() => { editor.chain().focus().addRowAfter().run(); setOpen(false) }}
            >
              <TableRowsSplit className="h-3.5 w-3.5 shrink-0" />
              Add row below
            </button>
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/60 transition-colors"
              onClick={() => { editor.chain().focus().deleteRow().run(); setOpen(false) }}
            >
              <TableRowsSplit className="h-3.5 w-3.5 shrink-0 rotate-180" />
              Delete row
            </button>
            <div className="h-px bg-border my-0.5" />
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/60 transition-colors"
              onClick={() => { editor.chain().focus().addColumnAfter().run(); setOpen(false) }}
            >
              <Columns2 className="h-3.5 w-3.5 shrink-0" />
              Add column right
            </button>
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/60 transition-colors"
              onClick={() => { editor.chain().focus().deleteColumn().run(); setOpen(false) }}
            >
              <Columns2 className="h-3.5 w-3.5 shrink-0 opacity-50" />
              Delete column
            </button>
            <div className="h-px bg-border my-0.5" />
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/60 transition-colors text-destructive"
              onClick={() => { editor.chain().focus().deleteTable().run(); setOpen(false) }}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Delete table
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Color scheme toggle ────────────────────────────────────────────────────────
const schemeOrder: ColorScheme[] = ['auto', 'light', 'dark']
const schemeIcons: Record<ColorScheme, React.ReactNode> = {
  auto:  <Monitor className="h-3.5 w-3.5" />,
  light: <Sun className="h-3.5 w-3.5" />,
  dark:  <Moon className="h-3.5 w-3.5" />,
}
const schemeTitles: Record<ColorScheme, string> = {
  auto:  'Color: Auto (follows theme)',
  light: 'Color: Light (white bg)',
  dark:  'Color: Dark (black bg)',
}
const schemeWrapperStyle: Record<ColorScheme, React.CSSProperties> = {
  auto:  {},
  light: { backgroundColor: '#ffffff' },
  dark:  { backgroundColor: '#000000' },
}

// ── Main component ─────────────────────────────────────────────────────────────
export function RichEditor({
  value,
  onChange,
  placeholder,
  fullHeight = false,
  showColorToggle = false,
  showFontSizeToggle = false,
  onImageUpload,
  fontSize: fontSizeProp,
  onFontSizeChange,
}: RichEditorProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('auto')
  const [internalFontSize, setInternalFontSize] = useState<FontSize>('sm')
  const fontSize = fontSizeProp ?? internalFontSize

  function handleFontSizeChange(size: FontSize) {
    if (onFontSizeChange) {
      onFontSizeChange(size)
    } else {
      setInternalFontSize(size)
    }
  }
  const wrapperRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TableKit,
      Image.configure({ inline: false, allowBase64: false }),
      Underline,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: buildEditorClass('auto', fontSizeProp ?? internalFontSize),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update prose class when color scheme or font size changes
  useEffect(() => {
    if (!editor) return
    editor.setOptions({
      editorProps: { attributes: { class: buildEditorClass(colorScheme, fontSize) } },
    })
  }, [editor, colorScheme, fontSize])

  const cycleScheme = useCallback(() => {
    setColorScheme(s => {
      const idx = schemeOrder.indexOf(s)
      return schemeOrder[(idx + 1) % schemeOrder.length]
    })
  }, [])

  // Click anywhere in the wrapper area below the editor content → focus editor
  function handleWrapperClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editor || !wrapperRef.current) return
    // Only trigger when clicking the wrapper itself, not child elements
    if (e.target === wrapperRef.current) {
      editor.commands.focus('end')
    }
  }

  if (!editor) return null

  const sep = <div className="w-px h-4 bg-border mx-0.5 shrink-0" />

  return (
    <div className={cn('flex flex-col overflow-hidden', fullHeight ? 'h-full' : '')}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b bg-muted/20 shrink-0">

        {/* Headings */}
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('heading', { level: 1 }) && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('heading', { level: 2 }) && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('heading', { level: 3 }) && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-3.5 w-3.5" />
        </Button>

        {sep}

        {/* Text format */}
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('bold') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('italic') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('strike') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('underline') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Button>

        {sep}

        {/* Block format */}
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('blockquote') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('code') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('codeBlock') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-3.5 w-3.5" />
        </Button>

        {sep}

        {/* Lists */}
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('bulletList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon"
          className={cn('h-7 w-7', editor.isActive('orderedList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        {sep}

        {/* Table */}
        <TablePopover editor={editor} />

        {/* Image */}
        <ImagePopover
          onInsert={(src, alt) => editor.chain().focus().setImage({ src, alt }).run()}
          onUpload={onImageUpload}
        />

        {/* Color scheme toggle — only when showColorToggle */}
        {showColorToggle && (
          <>
            {sep}
            <Button
              type="button" variant="ghost" size="icon"
              className={cn('h-7 w-7', colorScheme !== 'auto' && 'bg-muted')}
              onClick={cycleScheme}
              title={schemeTitles[colorScheme]}
            >
              {schemeIcons[colorScheme]}
            </Button>
          </>
        )}

        {/* Font size selector — only when showFontSizeToggle */}
        {showFontSizeToggle && (
          <>
            {sep}
            <div className="flex items-center gap-0.5">
              {fontSizeOrder.map(size => (
                <button
                  key={size}
                  type="button"
                  title={`Font size: ${size}`}
                  onClick={() => handleFontSizeChange(size)}
                  className={cn(
                    'h-7 px-1.5 rounded text-xs font-medium transition-colors hover:bg-muted',
                    fontSize === size ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {fontSizeLabels[size]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Editor content ── */}
      <div
        ref={wrapperRef}
        onClick={handleWrapperClick}
        style={schemeWrapperStyle[colorScheme]}
        className={cn(
          'overflow-y-auto transition-colors',
          fullHeight ? 'flex-1 min-h-0' : 'min-h-[200px]',
        )}
      >
        <EditorContent
          editor={editor}
          className={cn(fullHeight && 'min-h-full')}
        />
      </div>
    </div>
  )
}
