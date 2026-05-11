import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'
import { useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
}

const pool = new CognitoUserPool({
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
})

function sessionToUser(session: CognitoUserSession, cognitoUser: CognitoUser): AuthUser {
  const payload = session.getIdToken().decodePayload()
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? undefined,
    image: payload.picture ?? undefined,
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cognitoUser = pool.getCurrentUser()
    if (!cognitoUser) {
      setLoading(false)
      return
    }
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setLoading(false)
        return
      }
      setUser(sessionToUser(session, cognitoUser))
      setLoading(false)
    })
  }, [])

  function signOut() {
    const cognitoUser = pool.getCurrentUser()
    cognitoUser?.signOut()
    setUser(null)
  }

  return { user, loading, signOut }
}

export function signIn(email: string, password: string): Promise<AuthUser> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
    const authDetails = new AuthenticationDetails({ Username: email, Password: password })

    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve(sessionToUser(session, cognitoUser))
      },
      onFailure(err) {
        reject(err)
      },
      newPasswordRequired() {
        reject(new Error('NEW_PASSWORD_REQUIRED'))
      },
    })
  })
}

export { pool }