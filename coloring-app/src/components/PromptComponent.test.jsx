import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import PromptComponent from './PromptComponent';

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }) => <div data-testid="transform-wrapper">{children}</div>,
  TransformComponent: ({ children }) => <div data-testid="transform-component">{children}</div>,
}));

describe('PromptComponent', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Mock matchMedia for reduced motion
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
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    test('renders all form elements correctly', () => {
      render(<PromptComponent />);
      
      // Check main form elements
      expect(screen.getByLabelText(/describe your coloring page/i)).toBeInTheDocument();
      expect(screen.getByText(/select theme/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /customization options/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });

    test('renders textarea with correct placeholder', () => {
      render(<PromptComponent />);
      
      const textarea = screen.getByPlaceholderText(/e\.g\., unicorn in a forest/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    test('renders theme dropdown with all options', () => {
      render(<PromptComponent />);
      
      const themeSelect = screen.getByDisplayValue(/choose a theme/i);
      expect(themeSelect).toBeInTheDocument();
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5); // Including default option
      expect(screen.getByText('Animals')).toBeInTheDocument();
      expect(screen.getByText('Mandalas')).toBeInTheDocument();
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows validation error when prompt is empty', async () => {
      render(<PromptComponent />);
      
      const textarea = screen.getByLabelText(/describe your coloring page/i);
      await user.type(textarea, 'test');
      await user.clear(textarea);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a description/i)).toBeInTheDocument();
      });
    });

    test('disables generate button when form is invalid', () => {
      render(<PromptComponent />);
      
      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeDisabled();
      expect(generateButton).toHaveClass('opacity-50');
    });

    test('enables generate button when all required fields are filled', async () => {
      render(<PromptComponent />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a friendly dinosaur');
      
      // Open customization panel
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      
      // Select complexity - use the button in the complexity section specifically
      const complexitySection = screen.getByText('Detail Complexity').closest('div');
      await user.click(within(complexitySection).getByText('Medium'));
      
      // Select age group
      await user.click(screen.getByText('Kids'));
      
      // Select line thickness
      await user.selectOptions(screen.getByDisplayValue(/select thickness/i), 'medium');
      
      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /generate/i });
        expect(generateButton).not.toBeDisabled();
      });
    });

    test('shows green check icons when fields are valid', async () => {
      render(<PromptComponent />);
      
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a cat');
      
      await waitFor(() => {
        expect(screen.getByText(/a cat/)).toBeInTheDocument();
        // Check for green check icon (svg with specific class)
        const checkIcons = document.querySelectorAll('.text-green-500');
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Customization Panel', () => {
    test('toggles customization panel visibility', async () => {
      render(<PromptComponent />);
      
      const toggleButton = screen.getByRole('button', { name: /customization options/i });
      
      // Panel should be closed initially
      expect(screen.queryByText(/detail complexity/i)).not.toBeInTheDocument();
      
      // Click to open
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText(/detail complexity/i)).toBeInTheDocument();
        expect(screen.getByText(/age group/i)).toBeInTheDocument();
        expect(screen.getByText(/with border/i)).toBeInTheDocument();
        expect(screen.getByText(/line thickness/i)).toBeInTheDocument();
      });
      
      // Click to close
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/detail complexity/i)).not.toBeInTheDocument();
      });
    });

    test('handles radio button selections correctly', async () => {
      render(<PromptComponent />);
      
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      
      await waitFor(() => {
        const complexitySection = screen.getByText('Detail Complexity').closest('div');
        const simpleOption = within(complexitySection).getByText('Simple');
        const mediumOption = within(complexitySection).getByText('Medium');
        
        // Click simple
        user.click(simpleOption);
        
        expect(simpleOption.closest('label').querySelector('input')).toBeChecked();
        expect(mediumOption.closest('label').querySelector('input')).not.toBeChecked();
      });
    });

    test('handles checkbox for border option', async () => {
      render(<PromptComponent />);
      
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      
      await waitFor(async () => {
        const borderCheckbox = screen.getByLabelText(/with border/i);
        expect(borderCheckbox).not.toBeChecked();
        
        await user.click(borderCheckbox);
        expect(borderCheckbox).toBeChecked();
        
        await user.click(borderCheckbox);
        expect(borderCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Image Generation', () => {
    test('shows loading state during generation', async () => {
      render(<PromptComponent />);
      
      // Fill form
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a dog');
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      
      const complexitySection = screen.getByText('Detail Complexity').closest('div');
      await user.click(within(complexitySection).getByText('Medium'));
      await user.click(screen.getByText('Kids'));
      await user.selectOptions(screen.getByDisplayValue(/select thickness/i), 'medium');
      
      // Start generation
      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);
      
      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/generating\.\.\./i)).toBeInTheDocument();
        expect(generateButton).toBeDisabled();
      });
    });

    test('displays modal after successful generation', async () => {
      render(<PromptComponent />);
      
      // Fill form and generate
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a butterfly');
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      await user.click(screen.getByText('Simple'));
      await user.click(screen.getByText('Kids'));
      await user.selectOptions(screen.getByDisplayValue(/select thickness/i), 'thick');
      
      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);
      
      // Wait for generation to complete and modal to appear
      await waitFor(() => {
        expect(screen.getByText(/your coloring page is ready/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save to gallery/i })).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('displays generated image in preview area', async () => {
      render(<PromptComponent />);
      
      // Initially shows placeholder
      expect(screen.getByText(/your coloring page will appear here/i)).toBeInTheDocument();
      
      // Fill form and generate
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a tree');
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      await user.click(screen.getByText('Detailed'));
      await user.click(screen.getByText('Adults'));
      await user.selectOptions(screen.getByDisplayValue(/select thickness/i), 'thin');
      
      await user.click(screen.getByRole('button', { name: /generate/i }));
      
      // Wait for image to appear
      await waitFor(() => {
        const image = screen.getByAltText(/generated coloring page/i);
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src');
      }, { timeout: 5000 });
    });
  });

  describe('Modal Interactions', () => {
    const fillFormAndGenerate = async (user) => {
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a flower');
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      
      const complexitySection = screen.getByText('Detail Complexity').closest('div');
      await user.click(within(complexitySection).getByText('Medium'));
      await user.click(screen.getByText('Teens'));
      await user.selectOptions(screen.getByDisplayValue(/select thickness/i), 'medium');
      await user.click(screen.getByRole('button', { name: /generate/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/your coloring page is ready/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    };

    test('closes modal when close button is clicked', async () => {
      render(<PromptComponent />);
      
      await fillFormAndGenerate(user);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/your coloring page is ready/i)).not.toBeInTheDocument();
      });
    });

    test('handles download PDF action', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<PromptComponent />);
      
      await fillFormAndGenerate(user);
      
      const downloadButton = screen.getByRole('button', { name: /download pdf/i });
      await user.click(downloadButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Downloading PDF...');
      
      await waitFor(() => {
        expect(screen.queryByText(/your coloring page is ready/i)).not.toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles save to gallery action', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<PromptComponent />);
      
      await fillFormAndGenerate(user);
      
      const saveButton = screen.getByRole('button', { name: /save to gallery/i });
      await user.click(saveButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Saving to gallery...');
      
      await waitFor(() => {
        expect(screen.queryByText(/your coloring page is ready/i)).not.toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and attributes', () => {
      render(<PromptComponent />);
      
      const textarea = screen.getByLabelText(/describe your coloring page/i);
      expect(textarea).toHaveAttribute('aria-invalid');
      expect(textarea).toHaveAttribute('aria-describedby');
      
      const customizationButton = screen.getByRole('button', { name: /customization options/i });
      expect(customizationButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('updates aria-expanded when customization panel is toggled', async () => {
      render(<PromptComponent />);
      
      const toggleButton = screen.getByRole('button', { name: /customization options/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    test('supports keyboard navigation', async () => {
      render(<PromptComponent />);
      
      const textarea = screen.getByLabelText(/describe your coloring page/i);
      
      // Focus should work with keyboard
      textarea.focus();
      expect(textarea).toHaveFocus();
      
      // Tab navigation should work
      await user.tab();
      const themeSelect = screen.getByDisplayValue(/choose a theme/i);
      expect(themeSelect).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    test('applies mobile-friendly classes', () => {
      render(<PromptComponent />);
      
      const mainContainer = screen.getByRole('button', { name: /generate/i }).closest('div');
      expect(mainContainer).toHaveClass('w-full', 'md:w-auto');
    });

    test('handles form layout responsively', () => {
      render(<PromptComponent />);
      
      const formGrid = document.querySelector('.grid');
      expect(formGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });
  });

  describe('Animation and Performance', () => {
    test('applies CSS classes for animations', () => {
      render(<PromptComponent />);
      
      // Check for animation classes
      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toHaveClass('transition-all');
    });

    test('respects prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<PromptComponent />);
      
      // Component should still render properly with reduced motion
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });
  });

  describe('Prompt Refinement', () => {
    test('generates enhanced prompts correctly', async () => {
      render(<PromptComponent />);
      
      // Fill form with specific values
      await user.type(screen.getByLabelText(/describe your coloring page/i), 'a dragon');
      
      const themeSelect = screen.getByDisplayValue(/choose a theme/i);
      await user.selectOptions(themeSelect, 'fantasy');
      
      await user.click(screen.getByRole('button', { name: /customization options/i }));
      await user.click(screen.getByText('Detailed'));
      await user.click(screen.getByText('Adults'));
      await user.selectOptions(screen.getByDisplayValue(/select thickness/i), 'thick');
      
      const borderCheckbox = screen.getByLabelText(/with border/i);
      await user.click(borderCheckbox);
      
      const generateButton = screen.getByRole('button', { name: /generate/i });
      
      // Check if button has tooltip with refined prompt
      await waitFor(() => {
        expect(generateButton).toHaveAttribute('title');
        const title = generateButton.getAttribute('title');
        expect(title).toContain('dragon');
        expect(title).toContain('magical elements');
        expect(title).toContain('sophisticated and detailed');
        expect(title).toContain('bold, thick');
        expect(title).toContain('with decorative border');
      });
    });
  });
});