import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import LoginPage from './login'

vi.mock('@/hooks/use-auth', () => ({
    useAuth: vi.fn(),
    signIn: vi.fn(),
}))

vi.mock('@/components/cairn-lockup', () => ({
    CairnLockup: () => <div data-testid="cairn-lockup" />,
}))

import { useAuth, signIn } from '@/hooks/use-auth'

const mockUseAuth = vi.mocked(useAuth)
const mockSignIn = vi.mocked(signIn)

function renderLoginPage() {
    return render(
        <TooltipProvider>
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<div>Home Page</div>} />
                </Routes>
            </MemoryRouter>
        </TooltipProvider>
    )
}

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() })
    })

    it('renders the login form', () => {
        renderLoginPage()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('renders nothing while loading', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: true, signOut: vi.fn() })
        const { container } = renderLoginPage()
        expect(container).toBeEmptyDOMElement()
    })

    it('redirects to home when already authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'user-123', email: 'test@cairn.local' },
            loading: false,
            signOut: vi.fn(),
        })
        renderLoginPage()
        expect(screen.getByText('Home Page')).toBeInTheDocument()
    })

    it('submits the form with email and password', async () => {
        mockSignIn.mockResolvedValueOnce({
            id: 'user-123',
            email: 'test@cairn.local',
        })

        renderLoginPage()

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@cairn.local' },
        })
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@cairn.local', 'password123')
        })
    })

    it('shows signing in state while submitting', async () => {
        mockSignIn.mockImplementation(() => new Promise(() => {})) // never resolves

        renderLoginPage()

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@cairn.local' },
        })
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Signing in…' })).toBeInTheDocument()
        })
    })

    it('shows error message on failed login', async () => {
        mockSignIn.mockRejectedValueOnce(new Error('Incorrect username or password.'))

        renderLoginPage()

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@cairn.local' },
        })
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'wrongpassword' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        await waitFor(() => {
            expect(screen.getByText('Incorrect username or password.')).toBeInTheDocument()
        })
    })

    it('shows friendly message for NEW_PASSWORD_REQUIRED error', async () => {
        mockSignIn.mockRejectedValueOnce(new Error('NEW_PASSWORD_REQUIRED'))

        renderLoginPage()

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@cairn.local' },
        })
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        await waitFor(() => {
            expect(screen.getByText('You must set a new password. Please contact support.')).toBeInTheDocument()
        })
    })

    it('redirects to home after successful login', async () => {
        mockSignIn.mockResolvedValueOnce({
            id: 'user-123',
            email: 'test@cairn.local',
        })

        renderLoginPage()

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@cairn.local' },
        })
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        await waitFor(() => {
            expect(screen.getByText('Home Page')).toBeInTheDocument()
        })
    })
})