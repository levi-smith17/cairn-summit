import {
    AuthenticationDetails,
    CognitoUser,
    CognitoUserAttribute,
    CognitoUserSession,
} from 'amazon-cognito-identity-js'
import { type AuthUser, pool, sessionToUser } from '@/lib/cognito'

export type { AuthUser } from '@/lib/cognito'
export { useAuth } from '@/contexts/auth-context'

export type SignInResult =
    | { type: 'success'; user: AuthUser }
    | { type: 'newPasswordRequired'; cognitoUser: CognitoUser }

export function getAuthError(err: unknown): string {
    if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code
        const message = (err as { message?: string }).message ?? ''
        switch (code) {
            case 'NotAuthorizedException':
                return 'Incorrect email or password.'
            case 'UserNotFoundException':
                return 'No account found with that email.'
            case 'UserNotConfirmedException':
                return 'Please verify your email before signing in.'
            case 'UsernameExistsException':
                return 'An account with this email already exists.'
            case 'CodeMismatchException':
                return 'Incorrect verification code.'
            case 'ExpiredCodeException':
                return 'This code has expired. Please request a new one.'
            case 'LimitExceededException':
                return 'Too many attempts. Please try again later.'
            case 'InvalidPasswordException':
                return message
            default:
                return message || 'Something went wrong. Please try again.'
        }
    }
    if (err instanceof Error) {
        return err.message || 'Something went wrong. Please try again.'
    }
    return 'Something went wrong. Please try again.'
}

export function signIn(email: string, password: string): Promise<SignInResult> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
        const authDetails = new AuthenticationDetails({ Username: email, Password: password })

        cognitoUser.authenticateUser(authDetails, {
            onSuccess(session) {
                resolve({ type: 'success', user: sessionToUser(session, cognitoUser) })
            },
            onFailure(err) {
                reject(err)
            },
            newPasswordRequired() {
                resolve({ type: 'newPasswordRequired', cognitoUser })
            },
        })
    })
}

export function completeNewPassword(cognitoUser: CognitoUser, newPassword: string): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
        cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
            onSuccess(session) {
                resolve(sessionToUser(session, cognitoUser))
            },
            onFailure(err) {
                reject(err)
            },
        })
    })
}

export function signUp(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.signUp(
            email,
            password,
            [new CognitoUserAttribute({ Name: 'email', Value: email })],
            [],
            (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            }
        )
    })
}

export function confirmSignUp(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
        cognitoUser.confirmRegistration(code, true, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export function resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
        cognitoUser.resendConfirmationCode((err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export function forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
        cognitoUser.forgotPassword({
            onSuccess() {
                resolve()
            },
            onFailure(err) {
                reject(err)
            },
        })
    })
}

export function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
        cognitoUser.confirmPassword(code, newPassword, {
            onSuccess() {
                resolve()
            },
            onFailure(err) {
                reject(err)
            },
        })
    })
}
