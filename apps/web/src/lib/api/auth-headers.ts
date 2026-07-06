import { pool } from '@/lib/cognito'
import type { CognitoUserSession } from 'amazon-cognito-identity-js'

export async function getAuthHeaders(): Promise<Record<string, string>> {
    return new Promise((resolve) => {
        const cognitoUser = pool.getCurrentUser()
        if (!cognitoUser) return resolve({})

        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err || !session?.isValid()) return resolve({})

            // Check if token expires within the next 5 minutes
            const expiresAt = session.getIdToken().getExpiration() * 1000
            const fiveMinutes = 5 * 60 * 1000
            const needsRefresh = expiresAt - Date.now() < fiveMinutes

            const authHeader = (token: string) => `Bearer ${token}`

            if (!needsRefresh) {
                return resolve({ Authorization: authHeader(session.getIdToken().getJwtToken()) })
            }

            // Proactively refresh the session before it expires
            cognitoUser.refreshSession(
                session.getRefreshToken(),
                (refreshErr: Error | null, refreshedSession: CognitoUserSession | null) => {
                    if (refreshErr || !refreshedSession) {
                        // Fall back to existing token if refresh fails
                        return resolve({ Authorization: authHeader(session.getIdToken().getJwtToken()) })
                    }
                    resolve({ Authorization: authHeader(refreshedSession.getIdToken().getJwtToken()) })
                }
            )
        })
    })
}