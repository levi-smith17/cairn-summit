import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TerminologyProvider } from '@/contexts/terminology-context'
import { MarkerForm } from './marker-form'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock API calls
vi.mock('@/lib/api/markers', () => ({
    createMarker: vi.fn(),
    updateMarker: vi.fn(),
    deleteMarker: vi.fn(),
}))

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: vi.fn(() => ({
        invalidateQueries: vi.fn(),
    })),
}))

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
    useAuth: vi.fn(() => ({
        user: { id: 'user-123', email: 'test@cairn.local' },
        loading: false,
        signOut: vi.fn(),
    })),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

import { createMarker, updateMarker, deleteMarker } from '@/lib/api/markers'

const mockCreateMarker = vi.mocked(createMarker)
const mockUpdateMarker = vi.mocked(updateMarker)
const mockDeleteMarker = vi.mocked(deleteMarker)

const defaultProps = {
    tag: null,
    parentMarker: null,
    onBack: vi.fn(),
    onSaved: vi.fn(),
    onDeleted: vi.fn(),
}

function renderForm(props = {}) {
    return render(
        <TooltipProvider>
            <TerminologyProvider>
                <MarkerForm {...defaultProps} {...props} />
            </TerminologyProvider>
        </TooltipProvider>
    )
}

function getDeleteButton() {
    return screen.getByRole('button', {
        name: (_, element) => element?.querySelector('.lucide-trash-2') !== null,
    })
}

describe('MarkerForm — new marker', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the new marker form', () => {
        renderForm()
        expect(screen.getByText('New Marker')).toBeInTheDocument()
        expect(screen.getByLabelText('Name')).toBeInTheDocument()
        expect(screen.getByText('Color')).toBeInTheDocument()
    })

    it('shows validation error when name is empty', async () => {
        renderForm()
        fireEvent.click(screen.getByRole('button', { name: /add marker/i }))
        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument()
        })
    })

    it('calls createMarker with correct data on submit', async () => {
        mockCreateMarker.mockResolvedValueOnce({
            pk: 'USER#user-123',
            sk: 'MARKER#abc',
            name: 'Summit',
            color: '#ef4444',
            createdAt: '2026-01-01T00:00:00.000Z',
        })

        renderForm()

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Summit' },
        })
        fireEvent.click(screen.getByRole('button', { name: /add marker/i }))

        await waitFor(() => {
            expect(mockCreateMarker).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Summit' })
            )
        })
    })

    it('calls onSaved with the new marker id after creation', async () => {
        const onSaved = vi.fn()
        mockCreateMarker.mockResolvedValueOnce({
            pk: 'USER#user-123',
            sk: 'MARKER#abc-123',
            name: 'Summit',
            color: '#ef4444',
            createdAt: '2026-01-01T00:00:00.000Z',
        })

        renderForm({ onSaved })

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Summit' },
        })
        fireEvent.click(screen.getByRole('button', { name: /add marker/i }))

        await waitFor(() => {
            expect(onSaved).toHaveBeenCalledWith('abc-123')
        })
    })
})

describe('MarkerForm — edit marker', () => {
    const existingMarker = {
        id: 'abc-123',
        name: 'Summit',
        color: '#ef4444',
        icon: null,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the edit marker form with existing values', () => {
        renderForm({ tag: existingMarker })
        expect(screen.getByText('Edit Marker')).toBeInTheDocument()
        expect(screen.getByLabelText('Name')).toHaveValue('Summit')
    })

    it('shows delete button for existing marker', () => {
        renderForm({ tag: existingMarker })
        expect(getDeleteButton()).toBeInTheDocument()
    })

    it('calls updateMarker with correct data on submit', async () => {
        mockUpdateMarker.mockResolvedValueOnce({
            pk: 'USER#user-123',
            sk: 'MARKER#abc-123',
            name: 'Updated Summit',
            color: '#ef4444',
            createdAt: '2026-01-01T00:00:00.000Z',
        })

        renderForm({ tag: existingMarker })

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Updated Summit' },
        })
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

        await waitFor(() => {
            expect(mockUpdateMarker).toHaveBeenCalledWith(
                'abc-123',
                expect.objectContaining({ name: 'Updated Summit' })
            )
        })
    })

    it('opens delete confirmation dialog when delete is clicked', async () => {
        renderForm({ tag: existingMarker })
        fireEvent.click(getDeleteButton())
        await waitFor(() => {
            expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
        })
    })

    it('calls deleteMarker and onDeleted after confirmation', async () => {
        const onDeleted = vi.fn()
        mockDeleteMarker.mockResolvedValueOnce(undefined)

        renderForm({ tag: existingMarker, onDeleted })

        fireEvent.click(getDeleteButton())
        await waitFor(() => {
            expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))

        await waitFor(() => {
            expect(mockDeleteMarker).toHaveBeenCalledWith('abc-123')
            expect(onDeleted).toHaveBeenCalled()
        })
    })
})

describe('MarkerForm — sub-marker', () => {
    const parentMarker = {
        name: 'AWS',
        color: '#ef4444',
        icon: null,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders sub-marker form with parent context', () => {
        renderForm({ parentMarker })
        expect(screen.getByText('New Sub-Marker')).toBeInTheDocument()
        expect(screen.getByText('Parent marker')).toBeInTheDocument()
    })

    it('prefixes parent name when creating sub-marker', async () => {
        mockCreateMarker.mockResolvedValueOnce({
            pk: 'USER#user-123',
            sk: 'MARKER#abc',
            name: 'AWS/Compute',
            color: '#ef4444',
            createdAt: '2026-01-01T00:00:00.000Z',
        })

        renderForm({ parentMarker })

        fireEvent.change(screen.getByLabelText('Sub-marker name'), {
            target: { value: 'Compute' },
        })
        fireEvent.click(screen.getByRole('button', { name: /add marker/i }))

        await waitFor(() => {
            expect(mockCreateMarker).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'AWS/Compute' })
            )
        })
    })
})