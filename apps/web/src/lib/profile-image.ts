import { publicMediaUrl } from '@/lib/api/manifest'

export function resolveProfileImage(image: string | null | undefined): string | null {
  if (!image) return null
  if (image.startsWith('https://') || image.startsWith('data:')) {
    return image
  }
  // Upgrade insecure http URLs so HTTPS pages don't trip mixed-content blockers.
  if (image.startsWith('http://')) {
    return `https://${image.slice('http://'.length)}`
  }
  return publicMediaUrl(image)
}
