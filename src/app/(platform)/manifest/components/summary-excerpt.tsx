'use client'

import { useState } from 'react'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'

interface SummaryExcerptProps {
  summary: string
}

export function SummaryExcerpt({ summary }: SummaryExcerptProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-1">
        <RichTextContent html={summary} className="text-sm text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap" />
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground self-start underline underline-offset-4"
        >
          Read more
        </button>
      </div>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="h-full w-96 mt-0 right-0 left-auto rounded-none flex flex-col">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>Summary</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <RichTextContent html={summary} className="text-muted-foreground" />
          </div>
          <DrawerClose asChild>
            <button className="sr-only">Close</button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </>
  )
}