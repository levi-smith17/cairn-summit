'use client'

import { PublicWayfarerMenu } from "@/components/nav/public/public-wayfarer-menu"
import { ThemeToggle } from '@/components/nav/header-toggles'
import { type Terms } from '@/lib/terminology'

interface PublicHeaderProps {
    currentUser: {
        name: string | null
        email: string | null
        avatar: string | null
    } | null
    terminologyToggle?: React.ReactNode
    terms?: Terms
}

export function PublicHeader({ currentUser, terminologyToggle, terms }: PublicHeaderProps) {
    return (
        <div className="flex items-center gap-2">
            {/* Button group */}
            <div className="flex items-center rounded-md border divide-x overflow-hidden">
                {/* Terminology toggle — only rendered when passed in */}
                {terminologyToggle}

                {/* Theme toggle */}
                <ThemeToggle />
            </div>

            {/* User menu or login button */}
            <PublicWayfarerMenu currentUser={currentUser} terms={terms} />
        </div>
    )
}