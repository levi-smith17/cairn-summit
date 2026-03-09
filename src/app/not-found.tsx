import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-semibold text-muted-foreground">404</h1>
      <p className="text-lg font-medium">Page not found</p>
      <p className="text-sm text-muted-foreground">
        We couldn't find that page along the trail.
      </p>
      <Link
        href="/"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Return home
      </Link>
    </div>
  )
}