'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { MailOpen, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { markMessageRead, deleteMessage, sendReply } from '../actions'

interface MessageReply {
    id: string
    body: string
    direction: 'INBOUND' | 'OUTBOUND'
    senderName: string | null
    createdAt: Date
}

interface Message {
    id: string
    senderName: string
    senderEmail: string
    body: string
    read: boolean
    createdAt: Date
    replies: MessageReply[]
}

interface MessagesClientProps {
    messages: Message[]
}

function ReplyEditor({ messageId }: { messageId: string }) {
    const [pending, startTransition] = useTransition()

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit],
        editorProps: {
            attributes: {
                class: 'min-h-[60px] max-h-[160px] overflow-y-auto px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none',
            },
            handleKeyDown(_view, event) {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    handleSend()
                    return true
                }
                return false
            },
        },
    })

    function handleSend() {
        const html = editor?.getHTML()
        if (!html || html === '<p></p>') return
        startTransition(async () => {
            await sendReply(messageId, html)
            editor?.commands.clearContent()
        })
    }

    return (
        <div className="border-t bg-card p-3 flex flex-col gap-2 shrink-0">
            <div className="rounded-lg border border-input bg-background overflow-hidden">
                <EditorContent editor={editor} />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">⌘ Enter to send</span>
                <Button size="sm" onClick={handleSend} disabled={pending}>
                    <Send className="h-3.5 w-3.5" />
                    {pending ? 'Sending…' : 'Send'}
                </Button>
            </div>
        </div>
    )
}

export function MessagesClient({ messages }: MessagesClientProps) {
    const [selected, setSelected] = useState<string | null>(messages[0]?.id ?? null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const selectedMessage = messages.find((m) => m.id === selected)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [selectedMessage?.replies.length])

    const handleSelect = async (message: Message) => {
        setSelected(message.id)
        if (!message.read) await markMessageRead(message.id)
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-24 text-muted-foreground">
                <MailOpen className="h-10 w-10" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Messages sent via your contact page will appear here.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 h-full min-h-0 gap-4 overflow-hidden">
            {/* Left — inbox list */}
            <div className="w-72 shrink-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 min-h-[48px] flex items-center border-b border-border shrink-0">
                    <span className="text-sm font-medium">Inbox</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {messages.map((message, i) => (
                        <div key={message.id}>
                            <button
                                onClick={() => handleSelect(message)}
                                className={`w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-muted transition-colors ${selected === message.id ? 'bg-muted' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-sm truncate ${!message.read ? 'font-semibold' : 'font-medium'}`}>
                                        {message.senderName}
                                    </span>
                                    {!message.read && (
                                        <span className="h-2 w-2 rounded-full bg-header shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{message.body}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </p>
                            </button>
                            {i < messages.length - 1 && <Separator />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right — chat view */}
            <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card overflow-hidden">
                {selectedMessage ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 min-h-[48px] border-b border-border shrink-0">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{selectedMessage.senderName}</span>
                                <a
                                    href={`mailto:${selectedMessage.senderEmail}`}
                                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                                >
                                    {selectedMessage.senderEmail}
                                </a>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                title="Delete conversation"
                                onClick={async () => {
                                    await deleteMessage(selectedMessage.id)
                                    setSelected(messages.find((m) => m.id !== selectedMessage.id)?.id ?? null)
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Chat bubbles */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {/* Original message — incoming (left) */}
                            <div className="flex flex-col gap-1 items-start max-w-[70%]">
                                <span className="text-xs text-muted-foreground px-1">{selectedMessage.senderName}</span>
                                <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                                    {selectedMessage.body}
                                </div>
                                <span className="text-xs text-muted-foreground px-1">
                                    {format(new Date(selectedMessage.createdAt), 'MMM d, h:mm a')}
                                </span>
                            </div>

                            {/* Replies */}
                            {selectedMessage.replies.map((reply) => {
                                const isOutbound = reply.direction === 'OUTBOUND'
                                return (
                                    <div
                                        key={reply.id}
                                        className={`flex flex-col gap-1 max-w-[70%] ${isOutbound ? 'items-end self-end' : 'items-start'}`}
                                    >
                                        <span className="text-xs text-muted-foreground px-1">
                                            {isOutbound ? 'You' : (reply.senderName ?? selectedMessage.senderName)}
                                        </span>
                                        {isOutbound ? (
                                            <div
                                                className="rounded-2xl rounded-tr-none bg-primary text-primary-foreground px-4 py-2.5 text-sm prose prose-sm max-w-none [&_*]:text-primary-foreground [&_p:last-child]:mb-0"
                                                dangerouslySetInnerHTML={{ __html: reply.body }}
                                            />
                                        ) : (
                                            <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                                                {reply.body}
                                            </div>
                                        )}
                                        <span className="text-xs text-muted-foreground px-1">
                                            {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                )
                            })}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Reply composer */}
                        <ReplyEditor messageId={selectedMessage.id} />
                    </>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
                        Select a message
                    </div>
                )}
            </div>
        </div>
    )
}
