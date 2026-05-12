import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './protected-route'

// Mock useAuth so we control what it returns
vi.mock('@/hooks/use-auth', () => ({
    useAuth: vi.fn(),
}))

import { useAuth } from '@/hooks/use-auth'

const mockUseAuth = vi.mocked(useAuth)

// Helper to render ProtectedRoute within a router with a protected page and login page
function renderWithRouter() {
    return render(
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/protected" element={<div>Protected Content</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    )
}

describe('ProtectedRoute', () => {
    it('renders nothing while loading', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: true, signOut: vi.fn() })

        const { container } = renderWithRouter()
        expect(container).toBeEmptyDOMElement()
    })

    it('redirects to login when user is not authenticated', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() })

        renderWithRouter()
        expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('renders protected content when user is authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'user-123', email: 'test@cairn.local', name: 'Test User' },
            loading: false,
            signOut: vi.fn(),
        })

        renderWithRouter()
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('does not render protected content when unauthenticated', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() })

        renderWithRouter()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
})