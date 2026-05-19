import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, LayoutDashboard, LogOut } from 'lucide-react'
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
    wayfarer: {
        name: string | null
        email: string | null
        avatar: string | null
    } | null
    terms?: Terms
}

export function PublicWayfarerMenu({ wayfarer, terms }: PublicWayfarerMenuProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const isLoginPage = location.pathname === '/login'

    const initials = wayfarer?.name
        ? wayfarer.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : wayfarer?.email?.[0].toUpperCase() ?? '?'

    return (
        <>
            {wayfarer ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={wayfarer.avatar ?? undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{wayfarer.name ?? 'Wayfarer'}</span>
                                <span className="text-xs text-muted-foreground font-normal truncate">
                                    {wayfarer.email}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/basecamp')}>
                            <LayoutDashboard className="h-4 w-4" />
                            {terms?.basecamp ?? 'Basecamp'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/manifest')}>
                            <BookOpen className="h-4 w-4" />
                            My {terms?.manifest ?? 'Manifest'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/login')}>
                            <LogOut className="h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                !isLoginPage && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/login')}
                    >
                        Sign in
                    </Button>
                )
            )}
        </>
    )
}
