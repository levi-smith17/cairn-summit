'use client'

import { Button } from "@/components/ui/button";
import { LayoutList } from "lucide-react";
import { PublicWayfarerMenu } from "@/components/nav/public/public-wayfarer-menu"
import { ThemeToggle } from '@/components/nav/header-toggles'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from 'react-router-dom'
import { type Terms } from '@/lib/terminology'

interface PublicHeaderProps {
    wayfarer: {
        name: string | null
        email: string | null
        avatar: string | null
    } | null
    terminologyToggle?: React.ReactNode
    terms?: Terms
}

export function PublicHeader({ wayfarer, terminologyToggle, terms }: PublicHeaderProps) {
    return (
        <div className="flex items-center gap-2">
            {/* Button group */}
            <div className="flex items-center rounded-md border divide-x overflow-hidden">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/">
                            <Button variant="secondary" size="sm" className="rounded-none hover:bg-black/10 dark:hover:bg-white/10" asChild>
                                <span className="flex items-center gap-1.5">
                                  <LayoutList className="h-4 w-4" />
                                </span>
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        Head to the Outpost
                    </TooltipContent>
                </Tooltip>

                {/* Terminology toggle — only rendered when passed in */}
                {terminologyToggle}

                {/* Theme toggle */}
                <ThemeToggle />
            </div>

            {/* User menu or login button */}
            <PublicWayfarerMenu wayfarer={wayfarer} terms={terms} />
        </div>
    )
}