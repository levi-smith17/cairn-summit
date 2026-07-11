import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

function canHover(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function ToolbarTooltip({
  label,
  children,
  className,
  placement = 'below',
}: {
  label: string
  children: React.ReactNode
  className?: string
  placement?: 'above' | 'below' | 'right'
}) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const above = placement === 'above'
  const right = placement === 'right'

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (right) {
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      })
      return
    }
    setPosition({
      top: above ? rect.top - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
    })
  }, [above, right])

  const hide = useCallback(() => setVisible(false), [])

  const show = useCallback(() => {
    if (!canHover()) return
    updatePosition()
    setVisible(true)
  }, [updatePosition])

  useEffect(() => {
    if (!visible) return

    const onScroll = () => hide()
    const onPointerDown = () => hide()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [hide, visible])

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('flex items-center', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible &&
        position &&
        createPortal(
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[300] whitespace-nowrap',
              'rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md',
              right ? '-translate-y-1/2' : '-translate-x-1/2',
              above && !right && '-translate-y-full',
            )}
            style={{ top: position.top, left: position.left }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  )
}
