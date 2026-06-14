import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAuthError, signUp } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/routes/auth/auth-layout'

export default function SignupPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const prefillEmail = searchParams.get('email') ?? ''
    const inviteToken = searchParams.get('invite') ?? ''

    const [email, setEmail] = useState(prefillEmail)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setPending(true)
        try {
            await signUp(email, password)
            const inviteQs = inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ''
            navigate(`/verify-email?email=${encodeURIComponent(email)}${inviteQs}`)
        } catch (err: unknown) {
            setError(getAuthError(err))
        } finally {
            setPending(false)
        }
    }

    return (
        <AuthLayout>
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4">
                    <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={200} width={200} />
                    <p className="text-sm text-muted-foreground">Create your account</p>
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
                            placeholder="••••••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••••••"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        At least 12 characters with uppercase, lowercase, numbers, and symbols.
                    </p>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" disabled={pending} className="w-full">
                        {pending ? 'Creating account…' : 'Create account'}
                    </Button>
                </form>

                <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthLayout>
    )
}
