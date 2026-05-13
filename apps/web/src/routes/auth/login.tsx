import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signIn, useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FooterNav } from '@/components/nav/footer'
import {PublicHeader} from "@/components/nav/public/public-header";

export default function LoginPage() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    // Already authenticated — send to home
    if (loading) return null
    if (user) return <Navigate to="/" replace />

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        setError(null)
        try {
            await signIn(email, password)
            navigate('/')
        } catch (err: unknown) {
            console.error('Login error:', err)
            if (err instanceof Error) {
                setError(err.message === 'NEW_PASSWORD_REQUIRED'
                    ? 'You must set a new password. Please contact support.'
                    : err.message
                )
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 border-b">
                <img src="/cairn-lockup.png" alt="Cairn Summit Lockup" height={50} width={160} />
                <PublicHeader wayfarer={null} />
            </header>

            <div className="flex-1 flex items-center justify-center px-4">
                <div className="rounded-xl bg-muted/50 p-6 flex flex-col max-w-md w-full gap-4 relative">
                    <div className="w-full flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={200} width={200}/>
                            <p className="text-sm text-muted-foreground">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@cairn.ing"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            <Button type="submit" disabled={pending} className="w-full">
                                {pending ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="pb-6 flex justify-center">
                <FooterNav />
            </div>
        </div>
    )
}