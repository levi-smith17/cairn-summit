import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractId(sk: string | null | undefined): string {
  if (!sk) return ''
  return sk.split('#').pop() ?? sk
}

/** Last path segment of a hierarchical marker name (e.g. "Provisions/Food" → "Food"). */
export function markerShortLabel(name: string | null | undefined, fallback = 'Uncategorized'): string {
  if (!name) return fallback
  return name.split('/').pop() ?? name
}

/** Visible on touch; hidden until row hover on hover-capable devices. */
export const hoverReveal =
  'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity'

/** Hidden on row hover only on hover-capable devices (pair with hoverReveal). */
export const hoverRevealHidden =
  '[@media(hover:hover)]:group-hover:hidden'