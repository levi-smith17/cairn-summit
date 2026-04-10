// Module-level caches — persist across re-renders and client-side navigation within the session

export interface CachedBody {
  bodyHtml: string | null
  bodyText: string | null
  attachmentMeta: { filename: string; contentType: string; size: number }[]
}

export const bodyCache = new Map<string, CachedBody>()
export const mailboxCache = new Map<string, string[]>()
