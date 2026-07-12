import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CognitoUser } from 'amazon-cognito-identity-js'
import { completeNewPassword, getAuthError, signIn, useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/routes/auth/auth-layout'

export default function LoginPage() {
    const { user, loading, setUser } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [challenge, setChallenge] = useState<CognitoUser | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const verified = searchParams.get('verified') === 'true'
    const reset = searchParams.get('reset') === 'true'

    if (loading) return null
    if (user) return <Navigate to="/" replace />

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        setError(null)

        try {
            if (challenge) {
                if (newPassword !== confirmNewPassword) {
                    setError('Passwords do not match.')
                    setPending(false)
                    return
                }
                const authUser = await completeNewPassword(challenge, newPassword)
                setUser(authUser)
                navigate('/')
            } else {
                const result = await signIn(email, password)
                if (result.type === 'newPasswordRequired') {
                    setChallenge(result.cognitoUser)
                } else {
                    setUser(result.user)
                    navigate('/')
                }
            }
        } catch (err: unknown) {
            setError(getAuthError(err))
        } finally {
            setPending(false)
        }
    }

    return (
        <AuthLayout title="Log in">
            <div className="w-full flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4">
                    <img src="/cairn-summit.png" alt="Cairn Summit Logo" height={200} width={200} />
                    <p className="text-sm text-muted-foreground">
                        {challenge ? 'Your temporary password has expired. Please set a new password to continue.' : 'Sign in to your account'}
                    </p>
                </div>

                {verified && (
                    <p className="text-sm text-green-600 dark:text-green-400 text-center">
                        Email verified. You can now sign in.
                    </p>
                )}
                {reset && (
                    <p className="text-sm text-green-600 dark:text-green-400 text-center">
                        Password reset. You can now sign in with your new password.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    {challenge ? (
                        <>
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
                        </>
                    ) : (
                        <>
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
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
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
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" disabled={pending} className="w-full">
                        {pending
                            ? (challenge ? 'Setting password…' : 'Signing in…')
                            : (challenge ? 'Set password' : 'Sign in')
                        }
                    </Button>
                </form>

                {!challenge && (
                    <p className="text-sm text-center text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/signup" className="underline underline-offset-4 hover:text-foreground">
                            Sign up
                        </Link>
                    </p>
                )}
            </div>
        </AuthLayout>
    )
}
