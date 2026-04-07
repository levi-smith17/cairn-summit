/**
 * Returns '#ffffff' or '#000000' — whichever has better perceived contrast
 * against the given hex background color.
 *
 * Uses the standard sRGB luminance formula (ITU-R BT.601).
 */
export function contrastColor(hex: string): '#ffffff' | '#000000' {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
