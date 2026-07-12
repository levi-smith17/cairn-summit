import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { confirmForgotPassword, forgotPassword, getAuthError } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/routes/auth/auth-layout'

type Step = 'request' | 'confirm'

export default function ForgotPasswordPage() {
    const navigate = useNavigate()

    const [step, setStep] = useState<Step>('request')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function handleRequest(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        setError(null)
        try {
            await forgotPassword(email)
            setStep('confirm')
        } catch (err: unknown) {
            setError(getAuthError(err))
        } finally {
            setPending(false)
        }
    }

    async function handleConfirm(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match.')
            return
        }

        setPending(true)
        try {
            await confirmForgotPassword(email, code, newPassword)
            navigate('/login?reset=true')
        } catch (err: unknown) {
            setError(getAuthError(err))
        } finally {
            setPending(false)
        }
    }

    return (
        <AuthLayout title="Forgot password">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4">
                    <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={200} width={200} />
                    <p className="text-sm text-muted-foreground">
                        {step === 'request' ? 'Reset your password' : 'Enter your reset code'}
                    </p>
                </div>

                {step === 'request' ? (
                    <form onSubmit={handleRequest} className="flex flex-col gap-4 w-full">
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

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button type="submit" disabled={pending} className="w-full">
                            {pending ? 'Sending…' : 'Send reset code'}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
                                Back to sign in
                            </Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleConfirm} className="flex flex-col gap-4 w-full">
                        <p className="text-sm text-muted-foreground text-center">
                            We sent a code to {email}.
                        </p>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="code">Reset code</Label>
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

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="new-password">New password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="••••••••••••"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirm-new-password">Confirm new password</Label>
                            <Input
                                id="confirm-new-password"
                                type="password"
                                placeholder="••••••••••••"
                                value={confirmNewPassword}
                                onChange={e => setConfirmNewPassword(e.target.value)}
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
                            {pending ? 'Setting password…' : 'Set new password'}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                setStep('request')
                                setError(null)
                                setCode('')
                                setNewPassword('')
                                setConfirmNewPassword('')
                            }}
                        >
                            ← Use a different email
                        </Button>
                    </form>
                )}
            </div>
        </AuthLayout>
    )
}
