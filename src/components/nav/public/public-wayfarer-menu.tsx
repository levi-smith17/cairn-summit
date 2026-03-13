'use client'

import { logout } from '@/actions/auth'
import { useRouter } from 'next/navigation'
import { BookOpen, LayoutDashboard, LogOut, Mail } from 'lucide-react'
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
import { type Terms } from '@/lib/terminology'

interface PublicWayfarerMenuProps {
    currentUser: {
        name: string | null
        email: string | null
        avatar: string | null
    } | null
    terms?: Terms
}

export function PublicWayfarerMenu({ currentUser, terms }: PublicWayfarerMenuProps) {
    const router = useRouter()

    const initials = currentUser?.name
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : currentUser?.email?.[0].toUpperCase() ?? '?'

    return (
        <>
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
                        <DropdownMenuItem onClick={() => router.push('/basecamp')}>
                            <LayoutDashboard className="h-4 w-4" />
                            {terms?.basecamp ?? 'Basecamp'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/signals')}>
                            <Mail className="h-4 w-4" />
                            {terms?.signals ?? 'Signals'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/manifest')}>
                            <BookOpen className="h-4 w-4" />
                            My {terms?.manifest ?? 'Manifest'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()}>
                            <LogOut className="h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
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
        </>
    )
}