'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Sun, Moon, LayoutDashboard, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutMenuItem } from '@/components/nav/wayfarer/logout-menu-item'

interface PublicNavProps {
    currentUser: {
        name: string | null
        email: string | null
        avatar: string | null
    } | null
    terminologyToggle?: React.ReactNode
    showDirectoryLink?: boolean
}

export function PublicNav({ currentUser, terminologyToggle, showDirectoryLink }: PublicNavProps) {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const initials = currentUser?.name
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : currentUser?.email?.[0].toUpperCase() ?? '?'

    return (
        <div className="flex items-center gap-2">
            {/* Button group */}
            <div className="flex items-center rounded-md border divide-x overflow-hidden">
                {/* Terminology toggle — only rendered when passed in */}
                {terminologyToggle}

                {/* Theme toggle */}
                {mounted && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none"
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    >
                        {resolvedTheme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* User menu or login button */}
            {currentUser ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser.avatar ?? undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{currentUser.name ?? 'Wayfarer'}</span>
                                <span className="text-xs text-muted-foreground font-normal truncate">
                                    {currentUser.email}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/manifest')}>
                            <BookOpen className="h-4 w-4" />
                            My Manifest
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <LogoutMenuItem />
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/login')}
                >
                    Sign in
                </Button>
            )}
        </div>
    )
}