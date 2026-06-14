import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import { type AuthUser, pool, sessionToUser } from '@/lib/cognito'

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    setUser: (user: AuthUser | null) => void
    refreshSession: () => void
    signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshSession = useCallback(() => {
        const cognitoUser = pool.getCurrentUser()
        if (!cognitoUser) {
            setUser(null)
            setLoading(false)
            return
        }

        setLoading(true)
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err || !session?.isValid()) {
                setUser(null)
            } else {
                setUser(sessionToUser(session, cognitoUser))
            }
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        refreshSession()
    }, [refreshSession])

    const signOut = useCallback(() => {
        const cognitoUser = pool.getCurrentUser()
        cognitoUser?.signOut()
        setUser(null)
    }, [])

    const value = useMemo(
        () => ({ user, loading, setUser, refreshSession, signOut }),
        [user, loading, refreshSession, signOut]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
