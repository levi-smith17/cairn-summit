// ── Wayfarer ──────────────────────────────────────────
export interface Wayfarer {
    pk: string
    sk: 'PROFILE'
    username: string
    email: string
    customDomain?: string
    defaultTerminology: 'CAIRN' | 'STANDARD'
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
    timeFormat: 'TWELVE' | 'TWENTYFOUR'
    listed: boolean
    headline?: string
    summary?: string
    location?: string
    linkedin?: string
    github?: string
    createdAt: string
}

// ── Settings ───────────────────────────────────────────
export interface Settings {
    pk: string
    sk: 'SETTINGS'
    appearance: AppearanceSettings
    notifications: NotificationSettings
    privacy: PrivacySettings
    itinerary: ItinerarySettings
    waypoints: WaypointSettings
    logs: LogSettings
    signals: SignalSettings
}

export interface AppearanceSettings {
    sidebarDefault: 'EXPANDED' | 'COLLAPSED'
    defaultLandingPage: string
    dateFormat: 'MDY' | 'DMY' | 'YMD'
}

export interface NotificationSettings {
    browserNotifications: boolean
    emailDigest: 'NEVER' | 'DAILY' | 'WEEKLY'
}

export interface PrivacySettings {
    manifestVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
    contactFormEnabled: boolean
}

export interface ItinerarySettings {
    defaultView: 'MONTH' | 'WEEK' | 'DAY'
    firstDayOfWeek: 'SUNDAY' | 'MONDAY'
    defaultEventDuration: number
    showWeekNumbers: boolean
}

export interface WaypointSettings {
    defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
    openInNewTab: boolean
    waypointsPerPage: number
}

export interface LogSettings {
    logsPerPage: number
    defaultSort: 'NEWEST' | 'OLDEST'
}

export interface SignalSettings {
    messagesPerPage: number
    autoMarkRead: boolean
    autoRefreshInterval: number
    defaultView: 'SIGNALS' | 'EMAIL'
    compactView: boolean
    showSnippets: boolean
}

// ── Marker (denormalized, embedded in items) ───────────
export interface EmbeddedMarker {
    id: string
    name: string
    color: string
    icon?: string
}

// ── Waypoint ───────────────────────────────────────────
export interface Waypoint {
    pk: string
    sk: string
    url: string
    title: string
    description?: string
    favicon?: string
    notes?: string
    read: boolean
    readLater: boolean
    trailId?: string
    markers: EmbeddedMarker[]
    createdAt: string
}

// ── Log ────────────────────────────────────────────────
export interface Log {
    pk: string
    sk: string
    title?: string
    content: string
    position?: number
    trailId?: string
    waypointId?: string
    markers: EmbeddedMarker[]
    mediaKeys?: string[]
    createdAt: string
    updatedAt: string
}

// ── Trail ──────────────────────────────────────────────
export interface Trail {
    pk: string
    sk: string
    name: string
    createdAt: string
}

// ── Marker (full definition) ───────────────────────────
export interface Marker {
    pk: string
    sk: string
    name: string
    color: string
    icon?: string
    createdAt: string
}

// ── Guide ──────────────────────────────────────────────
export interface Guide {
    pk: string
    sk: string
    name: string
    description?: string
    trailId?: string
    createdAt: string
}

// ── Stone ──────────────────────────────────────────────
export interface Stone {
    pk: string
    sk: string
    guideId: string
    face: string
    core: string
    placement: 'UNPLACED' | 'PLACED' | 'SET' | 'SEATED'
    markers: EmbeddedMarker[]
    createdAt: string
}

// ── Signal + Reply ─────────────────────────────────────
export interface Signal {
    pk: string
    sk: string
    senderName: string
    senderEmail: string
    body: string
    read: boolean
    token?: string
    tokenExpiresAt?: string
    createdAt: string
}

export interface SignalReply {
    pk: string
    sk: string
    body: string
    direction: 'INBOUND' | 'OUTBOUND'
    senderName?: string
    senderEmail?: string
    createdAt: string
}

// ── Stop (Itinerary) ───────────────────────────────────
export interface Stop {
    pk: string
    sk: string
    title: string
    notes?: string
    location?: string
    startDate: string
    endDate?: string
    allDay: boolean
    recurrenceRule?: string
    exceptionDates?: string[]
    modifications?: Record<string, Partial<Stop>>
    icloudEventUid?: string
    icloudCalendarId?: string
    markers: EmbeddedMarker[]
    createdAt: string
    updatedAt: string
}

// ── Supplylines (recurring costs) ──────────────────────
export interface Supplyline {
    pk: string
    sk: string
    name: string
    amount: number
    billingCycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
    nextRenewal: string
    url?: string
    notes?: string
    active: boolean
    markers: EmbeddedMarker[]
    createdAt: string
}

// ── Burn (one-time expenses) ───────────────────────────
export interface Burn {
    pk: string
    sk: string
    name: string
    amount: number
    date: string
    notes?: string
    receiptUrl?: string
    markers: EmbeddedMarker[]
    createdAt: string
}

// ── Cache (marker-based budgets) ───────────────────────
export interface Cache {
    pk: string
    sk: string
    markerId: string
    markerName: string
    limit: number
    month: number
    year: number
}

// ── Manifest ───────────────────────────────────────────
export interface Expedition {
    pk: string
    sk: string
    title: string
    company: string
    location?: string
    startDate: string
    endDate?: string
    current: boolean
    description?: string
    createdAt: string
    updatedAt: string
}

export interface Training {
    pk: string
    sk: string
    institution: string
    degree?: string
    field?: string
    startDate: string
    endDate?: string
    current: boolean
    description?: string
    createdAt: string
    updatedAt: string
}

export interface Gear {
    pk: string
    sk: string
    name: string
    category?: string
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
    createdAt: string
}

export interface Landmark {
    pk: string
    sk: string
    name: string
    description?: string
    url?: string
    githubUrl?: string
    startDate?: string
    endDate?: string
    current: boolean
    summitIds: string[]
    createdAt: string
    updatedAt: string
}

export interface Summit {
    pk: string
    sk: string
    title: string
    issuer?: string
    date?: string
    description?: string
    url?: string
    createdAt: string
    updatedAt: string
}

export interface Pathfinding {
    pk: string
    sk: string
    organization: string
    role?: string
    location?: string
    startDate: string
    endDate?: string
    current: boolean
    description?: string
    createdAt: string
    updatedAt: string
}

export interface Companion {
    pk: string
    sk: string
    name: string
    species: string
    breed?: string
    birthday?: string
    bio?: string
    passed: boolean
    media: CompanionMedia[]
    createdAt: string
}

export interface CompanionMedia {
    id: string
    key: string
    type: 'IMAGE' | 'VIDEO'
    caption?: string
    order: number
    createdAt: string
}

// ── Starfield ──────────────────────────────────────────
export interface SfResource {
    pk: 'SF#RESOURCE'
    sk: string
    name: string
    abbreviation: string
    type: string
    tier: 0 | 1 | 2 | 3 | null
    mined: boolean
    ingredients: string[]
}

export interface SfNetwork {
    pk: string
    sk: string
    name: string
    rootFacilityId?: string
    createdAt: string
}

export interface SfFacility {
    pk: string
    sk: string
    networkId: string
    name: string
    abbreviation: string
    system: string
    planet: string
    parentId?: string
    depth: number
    position: { x: number; y: number }
    resources: SfFacilityResource[]
    transferStationLimit: number
}

export interface SfFacilityResource {
    resourceId: string
    name: string
    abbreviation: string
    onsite: boolean
    fromFacilityId?: string
    relay?: {
        planet: string
        system: string
    }
}

// ── API response wrapper ───────────────────────────────
export interface ApiResponse<T> {
    data?: T
    error?: string
    statusCode: number
}