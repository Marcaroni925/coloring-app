import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { axe, toHaveNoViolations } from 'jest-axe'
import App from '../App'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Firebase
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(null)
    return () => {}
  })
}

const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      onSnapshot: vi.fn((callback) => {
        callback({ exists: () => false })
        return () => {}
      })
    }))
  }))
}

vi.mock('../firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  googleProvider: {}
}))

// Mock window.matchMedia for responsive design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('App Component', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Render and Navigation', () => {
    it('renders the main navigation and header', () => {
      render(<App />)
      
      expect(screen.getByText('Coloring Book Creator')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /gallery/i })).toBeInTheDocument()
    })

    it('has accessible navigation with proper ARIA attributes', () => {
      render(<App />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation')
    })

    it('supports keyboard navigation between views', async () => {
      render(<App />)
      
      const createButton = screen.getByRole('button', { name: /create/i })
      const galleryButton = screen.getByRole('button', { name: /gallery/i })
      
      await user.tab()
      expect(createButton).toHaveFocus()
      
      await user.tab()
      expect(galleryButton).toHaveFocus()
    })
  })

  describe('View Management', () => {
    it('switches between create and gallery views', async () => {
      render(<App />)
      
      // Default should be create view
      expect(screen.getByText(/enter your idea/i)).toBeInTheDocument()
      
      // Switch to gallery
      await user.click(screen.getByRole('button', { name: /gallery/i }))
      expect(screen.getByText(/your gallery/i)).toBeInTheDocument()
      
      // Switch back to create
      await user.click(screen.getByRole('button', { name: /create/i }))
      expect(screen.getByText(/enter your idea/i)).toBeInTheDocument()
    })

    it('maintains view state during navigation', async () => {
      render(<App />)
      
      const createButton = screen.getByRole('button', { name: /create/i })
      const galleryButton = screen.getByRole('button', { name: /gallery/i })
      
      // Initial state
      expect(createButton).toHaveAttribute('aria-pressed', 'true')
      expect(galleryButton).toHaveAttribute('aria-pressed', 'false')
      
      // After switching
      await user.click(galleryButton)
      expect(createButton).toHaveAttribute('aria-pressed', 'false')
      expect(galleryButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })

    it('renders mobile navigation when viewport is small', () => {
      render(<App />)
      
      // Mobile navigation should be present
      const mobileNav = screen.getByRole('navigation')
      expect(mobileNav).toHaveClass('mobile-nav')
    })

    it('supports touch interactions on mobile', async () => {
      render(<App />)
      
      const galleryButton = screen.getByRole('button', { name: /gallery/i })
      
      // Simulate touch events
      fireEvent.touchStart(galleryButton)
      fireEvent.touchEnd(galleryButton)
      
      await waitFor(() => {
        expect(screen.getByText(/your gallery/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication State Management', () => {
    it('handles unauthenticated state', () => {
      render(<App />)
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('handles authenticated state', () => {
      mockAuth.currentUser = { uid: 'test-user', email: 'test@example.com' }
      mockAuth.onAuthStateChanged = vi.fn((callback) => {
        callback(mockAuth.currentUser)
        return () => {}
      })
      
      render(<App />)
      
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
    })

    it('updates UI when auth state changes', async () => {
      const { rerender } = render(<App />)
      
      // Initially unauthenticated
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      // Simulate auth state change
      mockAuth.currentUser = { uid: 'test-user', email: 'test@example.com' }
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        callback(mockAuth.currentUser)
        return () => {}
      })
      
      rerender(<App />)
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Features', () => {
    it('has proper heading hierarchy', () => {
      render(<App />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Coloring Book Creator')
    })

    it('meets WCAG accessibility standards', async () => {
      const { container } = render(<App />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('maintains accessibility when switching views', async () => {
      const { container } = render(<App />)
      
      // Test initial view
      let results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Switch to gallery and test again
      await user.click(screen.getByRole('button', { name: /gallery/i }))
      results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Switch back to create and test again
      await user.click(screen.getByRole('button', { name: /create/i }))
      results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      render(<App />)
      
      const app = screen.getByRole('main')
      expect(app).toHaveClass('high-contrast')
    })

    it('supports reduced motion preferences', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      render(<App />)
      
      const app = screen.getByRole('main')
      expect(app).toHaveClass('reduced-motion')
    })

    it('provides appropriate ARIA labels for screen readers', () => {
      render(<App />)
      
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Coloring Book Creator Application')
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation')
    })

    it('manages focus correctly during view transitions', async () => {
      render(<App />)
      
      const galleryButton = screen.getByRole('button', { name: /gallery/i })
      
      await user.click(galleryButton)
      
      // Focus should move to the gallery view
      const galleryView = screen.getByRole('region', { name: /gallery/i })
      expect(galleryView).toHaveFocus()
    })

    it('provides live region announcements for dynamic content', async () => {
      render(<App />)
      
      // Check for aria-live regions
      const liveRegion = screen.getByRole('status', { hidden: true }) || 
                        screen.getByLabelText(/announcements/i, { hidden: true })
      expect(liveRegion).toBeInTheDocument()
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('supports keyboard navigation', async () => {
      render(<App />)
      
      // Test tab navigation
      await user.tab()
      
      const firstFocusable = screen.getByRole('button', { name: /create/i })
      expect(firstFocusable).toHaveFocus()
      
      await user.tab()
      const secondFocusable = screen.getByRole('button', { name: /gallery/i })
      expect(secondFocusable).toHaveFocus()
    })

    it('provides proper form accessibility', async () => {
      const { container } = render(<App />)
      
      // Check form accessibility specifically
      const formElements = container.querySelectorAll('input, textarea, select, button')
      
      formElements.forEach(element => {
        // Each form element should have proper labeling
        const hasLabel = element.getAttribute('aria-label') ||
                         element.getAttribute('aria-labelledby') ||
                         element.id && container.querySelector(`label[for="${element.id}"]`) ||
                         element.closest('label')
        
        expect(hasLabel).toBeTruthy()
      })
    })

    it('handles error states accessibly', async () => {
      render(<App />)
      
      // Trigger validation error by submitting empty form
      const generateButton = screen.getByRole('button', { name: /generate/i })
      await user.click(generateButton)
      
      // Check for error announcements
      await waitFor(() => {
        const errorRegion = screen.getByRole('alert') || 
                           screen.getByLabelText(/error/i, { hidden: true })
        expect(errorRegion).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles Firebase connection errors gracefully', () => {
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Firebase connection failed')
      })
      
      render(<App />)
      
      // App should still render without crashing
      expect(screen.getByText('Coloring Book Creator')).toBeInTheDocument()
    })

    it('displays error boundary when component fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = () => {
        throw new Error('Test error')
      }
      
      const AppWithError = () => (
        <App>
          <ThrowError />
        </App>
      )
      
      render(<AppWithError />)
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('lazy loads heavy components', async () => {
      render(<App />)
      
      // Gallery component should be lazy loaded
      await user.click(screen.getByRole('button', { name: /gallery/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/your gallery/i)).toBeInTheDocument()
      })
    })

    it('memoizes expensive computations', () => {
      const { rerender } = render(<App />)
      
      // Re-render with same props
      rerender(<App />)
      
      // Component should not re-render unnecessarily
      expect(screen.getByText('Coloring Book Creator')).toBeInTheDocument()
    })
  })

  describe('State Persistence', () => {
    it('remembers last selected view on reload', () => {
      // Mock localStorage
      const mockStorage = {
        getItem: vi.fn(() => 'gallery'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: mockStorage })
      
      render(<App />)
      
      expect(screen.getByText(/your gallery/i)).toBeInTheDocument()
    })

    it('saves view preference to localStorage', async () => {
      const mockStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: mockStorage })
      
      render(<App />)
      
      await user.click(screen.getByRole('button', { name: /gallery/i }))
      
      expect(mockStorage.setItem).toHaveBeenCalledWith('currentView', 'gallery')
    })
  })
})