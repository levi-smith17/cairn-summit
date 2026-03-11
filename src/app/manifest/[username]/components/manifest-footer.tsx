import Link from 'next/link'

export function ManifestFooter() {
    return (
        <div className="flex flex-col items-center gap-1.5 pt-8 print:hidden">
            <p className="text-xs text-muted-foreground">
                Built with{' '}
                <Link href="/" className="underline underline-offset-4 hover:text-foreground">
                    Cairn
                </Link>
            </p>
            <p className="text-xs text-muted-foreground">
                <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                    Privacy Policy
                </Link>
                {' · '}
                <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                    Terms of Service
                </Link>
                {' · '}
                <Link href="/privacy-contact" className="underline underline-offset-4 hover:text-foreground">
                    Privacy Request
                </Link>
            </p>
        </div>
    )
}
