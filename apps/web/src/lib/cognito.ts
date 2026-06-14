import {
    CognitoUser,
    CognitoUserPool,
    CognitoUserSession,
} from 'amazon-cognito-identity-js'

export interface AuthUser {
    id: string
    email: string
    name?: string
    image?: string
}

export const pool = new CognitoUserPool({
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
})

export function sessionToUser(session: CognitoUserSession, cognitoUser: CognitoUser): AuthUser {
    const payload = session.getIdToken().decodePayload()
    return {
        id: payload.sub,
        email: payload.email,
        name: payload.name ?? undefined,
        image: payload.picture ?? undefined,
    }
}
