import { publicMediaUrl } from '@/lib/api/manifest'

export function resolveProfileImage(image: string | null | undefined): string | null {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
    return image
  }
  return publicMediaUrl(image)
}
