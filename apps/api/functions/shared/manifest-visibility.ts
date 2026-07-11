export type ManifestVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE'

export function getManifestVisibility(settings: Record<string, unknown> | null | undefined): ManifestVisibility | null {
    const privacy = settings?.privacy as { manifestVisibility?: string } | undefined
    const value = privacy?.manifestVisibility
    if (value === 'PUBLIC' || value === 'UNLISTED' || value === 'PRIVATE') return value
    return null
}

/** Directory listing: listed + PUBLIC only. UNLISTED is link-only. Admins bypass. */
export function isListedInOutpost(opts: {
    listed: boolean | null | undefined
    visibility: ManifestVisibility | null
    isAdmin: boolean
}): boolean {
    if (opts.isAdmin) return true
    if (opts.listed === false) return false
    if (opts.visibility === 'PRIVATE' || opts.visibility === 'UNLISTED') return false
    // PUBLIC or legacy (null) with listed !== false
    return true
}

/** Public manifest view: PRIVATE only for owner/admin. Missing visibility = legacy open. */
export function canViewPublicManifest(opts: {
    visibility: ManifestVisibility | null
    isOwner: boolean
    isAdmin: boolean
}): boolean {
    if (opts.visibility !== 'PRIVATE') return true
    return opts.isOwner || opts.isAdmin
}
