import { Link } from 'react-router-dom'

interface FooterNavProps {
    showCairn?: boolean;
}

export function FooterNav({ showCairn = false }: FooterNavProps) {
    return (
        <div className={`flex flex-col gap-1.5 ${showCairn ? 'pt-8 items-center' : ''} print:hidden`}>
            {showCairn &&
                <p className="text-xs text-muted-foreground">
                    Built with{' '}
                    <Link to="/" className="underline underline-offset-4 hover:text-foreground">
                        Cairn
                    </Link>
                </p>
            }
            <p className="text-xs text-muted-foreground">
                <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
                    Privacy
                </Link>
                {' · '}
                <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
                    Terms
                </Link>
                {' · '}
                <Link to="/privacy-contact" className="underline underline-offset-4 hover:text-foreground">
                    Privacy Request
                </Link>
            </p>
        </div>
    )
}
