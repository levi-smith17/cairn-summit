/** Slugify names the same way as starfield system-create API. */
export function starfieldSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
