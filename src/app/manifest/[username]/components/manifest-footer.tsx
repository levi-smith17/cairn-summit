import Link from 'next/link'
import { NavFooter } from '@/components/nav/footer'

export function ManifestFooter() {
    return (
        <div className="flex flex-col items-center gap-1.5 pt-8 print:hidden">
            <p className="text-xs text-muted-foreground">
                Built with{' '}
                <Link href="/" className="underline underline-offset-4 hover:text-foreground">
                    Cairn
                </Link>
            </p>
            <NavFooter />
        </div>
    )
}
