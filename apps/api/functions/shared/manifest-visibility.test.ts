import { describe, it, expect } from 'vitest'
import {
    canViewPublicManifest,
    getManifestVisibility,
    isListedInOutpost,
} from './manifest-visibility'

describe('getManifestVisibility', () => {
    it('reads nested privacy.manifestVisibility', () => {
        expect(getManifestVisibility({ privacy: { manifestVisibility: 'PUBLIC' } })).toBe('PUBLIC')
        expect(getManifestVisibility({ privacy: { manifestVisibility: 'UNLISTED' } })).toBe('UNLISTED')
        expect(getManifestVisibility({ privacy: { manifestVisibility: 'PRIVATE' } })).toBe('PRIVATE')
    })

    it('returns null for missing or invalid values', () => {
        expect(getManifestVisibility(undefined)).toBeNull()
        expect(getManifestVisibility({})).toBeNull()
        expect(getManifestVisibility({ privacy: {} })).toBeNull()
        expect(getManifestVisibility({ privacy: { manifestVisibility: 'SECRET' } })).toBeNull()
    })
})

describe('isListedInOutpost', () => {
    it('includes listed PUBLIC (and legacy null) for non-admins', () => {
        expect(isListedInOutpost({ listed: true, visibility: 'PUBLIC', isAdmin: false })).toBe(true)
        expect(isListedInOutpost({ listed: true, visibility: null, isAdmin: false })).toBe(true)
    })

    it('excludes UNLISTED, unlisted flag, and PRIVATE for non-admins', () => {
        expect(isListedInOutpost({ listed: true, visibility: 'UNLISTED', isAdmin: false })).toBe(false)
        expect(isListedInOutpost({ listed: false, visibility: 'PUBLIC', isAdmin: false })).toBe(false)
        expect(isListedInOutpost({ listed: true, visibility: 'PRIVATE', isAdmin: false })).toBe(false)
        expect(isListedInOutpost({ listed: false, visibility: 'PRIVATE', isAdmin: false })).toBe(false)
    })

    it('admins see everyone', () => {
        expect(isListedInOutpost({ listed: false, visibility: 'PRIVATE', isAdmin: true })).toBe(true)
        expect(isListedInOutpost({ listed: true, visibility: 'UNLISTED', isAdmin: true })).toBe(true)
    })
})

describe('canViewPublicManifest', () => {
    it('allows PUBLIC, UNLISTED, and legacy-null for anyone', () => {
        expect(canViewPublicManifest({ visibility: 'PUBLIC', isOwner: false, isAdmin: false })).toBe(true)
        expect(canViewPublicManifest({ visibility: 'UNLISTED', isOwner: false, isAdmin: false })).toBe(true)
        expect(canViewPublicManifest({ visibility: null, isOwner: false, isAdmin: false })).toBe(true)
    })

    it('restricts PRIVATE to owner or admin', () => {
        expect(canViewPublicManifest({ visibility: 'PRIVATE', isOwner: false, isAdmin: false })).toBe(false)
        expect(canViewPublicManifest({ visibility: 'PRIVATE', isOwner: true, isAdmin: false })).toBe(true)
        expect(canViewPublicManifest({ visibility: 'PRIVATE', isOwner: false, isAdmin: true })).toBe(true)
    })
})
