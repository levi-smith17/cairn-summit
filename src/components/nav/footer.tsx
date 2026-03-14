import Link from 'next/link'

export function NavFooter() {
    return (
        <p className="text-xs text-muted-foreground">
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy
            </Link>
            {' · '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                Terms
            </Link>
            {' · '}
            <Link href="/privacy-contact" className="underline underline-offset-4 hover:text-foreground">
                Privacy Request
            </Link>
        </p>
    )
}
