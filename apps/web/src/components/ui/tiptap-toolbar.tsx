'use client'

import { type Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Quote,
    Code, FileCode, Highlighter, Link2,
} from 'lucide-react'

interface TipTapToolbarProps {
    editor: Editor | null
}

export function TipTapToolbar({ editor }: TipTapToolbarProps) {
    if (!editor) return null

    function handleLink() {
        const prev = editor?.getAttributes('link').href ?? ''
        const url = window.prompt('URL', prev)
        if (url === null) return
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
            editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }
    }

    const btn = (active: boolean) => cn('h-7 w-7', active && 'bg-muted')

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <Underline className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <FileCode className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()}>
                <Highlighter className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={btn(editor.isActive('link'))} onClick={handleLink}>
                <Link2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}
