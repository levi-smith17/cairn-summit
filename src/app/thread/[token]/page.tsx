import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ThreadForm } from './thread-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ThreadPageProps {
    params: Promise<{ token: string }>
}

export default async function ThreadPage({ params }: ThreadPageProps) {
    const { token } = await params

    const message = await prisma.message.findUnique({
        where: { token },
        select: {
            id: true,
            senderName: true,
            body: true,
            createdAt: true,
            tokenExpiresAt: true,
            replies: { orderBy: { createdAt: 'asc' } },
            wayfarer: {
                select: { name: true, image: true, username: true },
            },
        },
    })

    if (!message) notFound()

    const expired = !message.tokenExpiresAt || message.tokenExpiresAt < new Date()
    const wayfarer = message.wayfarer
    const initials = wayfarer.name
        ? wayfarer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : '?'

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between py-2 px-4 bg-header border-b">
                <a href="/" className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Cairn</span>
                </a>
                {wayfarer.username && (
                    <a
                        href={`/manifest/${wayfarer.username}`}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                        View {wayfarer.name ?? wayfarer.username}'s manifest
                    </a>
                )}
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 flex flex-col gap-8">
                {/* Wayfarer info */}
                <div className="flex items-center gap-4 pt-8">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={wayfarer.image ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-semibold">
                            Conversation with {wayfarer.name ?? wayfarer.username}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {expired
                                ? 'This conversation link has expired.'
                                : `Link valid until ${format(message.tokenExpiresAt!, 'MMM d, yyyy')}`}
                        </p>
                    </div>
                </div>

                {/* Thread */}
                <div className="flex flex-col gap-4">
                    {/* Original message */}
                    <div className="flex flex-col gap-1 items-start max-w-[80%]">
                        <span className="text-xs text-muted-foreground px-1">{message.senderName}</span>
                        <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                            {message.body}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                        </span>
                    </div>

                    {/* Replies */}
                    {message.replies.map((reply) => {
                        const isOutbound = reply.direction === 'OUTBOUND'
                        return (
                            <div
                                key={reply.id}
                                className={`flex flex-col gap-1 max-w-[80%] ${isOutbound ? 'items-end self-end' : 'items-start'}`}
                            >
                                <span className="text-xs text-muted-foreground px-1">
                                    {isOutbound ? (wayfarer.name ?? 'Them') : reply.senderName}
                                </span>
                                {isOutbound ? (
                                    <div
                                        className="rounded-2xl rounded-tr-none bg-primary text-primary-foreground px-4 py-2.5 text-sm prose prose-sm max-w-none [&_*]:text-primary-foreground [&_p:last-child]:mb-0"
                                        dangerouslySetInnerHTML={{ __html: reply.body }}
                                    />
                                ) : (
                                    <div
                                        className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm prose prose-sm dark:prose-invert max-w-none [&_p:last-child]:mb-0"
                                        dangerouslySetInnerHTML={{ __html: reply.body }}
                                    />
                                )}
                                <span className="text-xs text-muted-foreground px-1">
                                    {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Reply form or expired notice */}
                {expired ? (
                    <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            This conversation link has expired. To continue,{' '}
                            {wayfarer.username && (
                                <a
                                    href={`/manifest/${wayfarer.username}/contact`}
                                    className="underline underline-offset-4 hover:text-foreground"
                                >
                                    send a new message
                                </a>
                            )}.
                        </p>
                    </div>
                ) : (
                    <ThreadForm token={token} wayfarerName={wayfarer.name} />
                )}

                <div className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                        Built with{' '}
                        <a href="/" className="underline underline-offset-4 hover:text-foreground">
                            Cairn
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: ThreadPageProps) {
    const { token } = await params
    const message = await prisma.message.findUnique({
        where: { token },
        select: { wayfarer: { select: { name: true } } },
    })
    return { title: `Conversation with ${message?.wayfarer.name ?? 'Wayfarer'}` }
}
