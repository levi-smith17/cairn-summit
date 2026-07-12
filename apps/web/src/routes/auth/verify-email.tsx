import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmSignUp, getAuthError, resendConfirmationCode } from '@/hooks/use-auth'
import { acceptInvite } from '@/lib/api/invite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/routes/auth/auth-layout'

export default function VerifyEmailPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const email = searchParams.get('email') ?? ''
    const inviteToken = searchParams.get('invite') ?? ''

    const [code, setCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [resent, setResent] = useState(false)

    if (!email) {
        return (
            <AuthLayout title="Verify email">
                <div className="w-full flex flex-col gap-4 items-center">
                    <p className="text-sm text-destructive text-center">
                        No email address provided.
                    </p>
                    <Link to="/signup" className="text-sm underline underline-offset-4 hover:text-foreground">
                        Back to sign up
                    </Link>
                </div>
            </AuthLayout>
        )
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        setError(null)
        try {
            await confirmSignUp(email, code)
            if (inviteToken) {
                try {
                    await acceptInvite(inviteToken, email)
                } catch {
                    // Signup succeeded even if invite acceptance fails
                }
            }
            navigate('/login?verified=true')
        } catch (err: unknown) {
            setError(getAuthError(err))
        } finally {
            setPending(false)
        }
    }

    async function handleResend() {
        setError(null)
        setResent(false)
        try {
            await resendConfirmationCode(email)
            setResent(true)
        } catch (err: unknown) {
            setError(getAuthError(err))
        }
    }

    return (
        <AuthLayout title="Verify email">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4">
                    <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={200} width={200} />
                    <p className="text-sm text-muted-foreground">Verify your email</p>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                    We sent a 6-digit code to {email}.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="code">Verification code</Label>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            required
                            autoComplete="one-time-code"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    {resent && (
                        <p className="text-sm text-green-600 dark:text-green-400">Code resent.</p>
                    )}

                    <Button type="submit" disabled={pending} className="w-full">
                        {pending ? 'Verifying…' : 'Verify email'}
                    </Button>
                </form>

                <div className="flex flex-col items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResend}
                    >
                        Resend code
                    </Button>
                    <Link to="/login" className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground">
                        Back to sign in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    )
}
