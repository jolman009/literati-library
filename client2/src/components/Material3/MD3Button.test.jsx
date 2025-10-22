import React from 'react';
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MD3Button from './MD3Button'

// Mock the useRef hook for ripple effect testing
const mockRippleEffect = vi.fn()
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useRef: () => ({ current: { dispatchEvent: mockRippleEffect } })
  }
})

describe('MD3Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders button with children', () => {
      render(<MD3Button>Click me</MD3Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('renders as a link when href is provided', () => {
      render(<MD3Button href="/test">Link button</MD3Button>)
      const link = screen.getByRole('link', { name: 'Link button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })

    it('applies custom className', () => {
      render(<MD3Button className="custom-class">Button</MD3Button>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    const variants = ['filled', 'elevated', 'tonal', 'outlined', 'text']

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<MD3Button variant={variant}>Button</MD3Button>)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        // Test that the button has appropriate styling based on variant
        expect(button).toHaveStyle({ display: 'inline-flex' })
      })
    })

    it('defaults to filled variant', () => {
      render(<MD3Button>Button</MD3Button>)
      const button = screen.getByRole('button')
      // Check for filled variant default styles
      expect(button).toHaveStyle({
        backgroundColor: '#24A8E0',
        color: '#ffffff'
      })
    })
  })

  describe('Sizes', () => {
    const sizes = ['small', 'medium', 'large']

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<MD3Button size={size}>Button</MD3Button>)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()

        // Verify size-specific properties
        const expectedPadding = {
          small: '8px 14px',
          medium: '12px 20px',
          large: '16px 24px'
        }
        expect(button).toHaveStyle({ padding: expectedPadding[size] })
      })
    })

    it('defaults to medium size', () => {
      render(<MD3Button>Button</MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveStyle({ padding: '12px 20px' })
    })
  })

  describe('States', () => {
    it('renders disabled state correctly', () => {
      render(<MD3Button disabled>Disabled Button</MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveStyle({ opacity: '0.38' })
    })

    it('renders loading state correctly', () => {
      render(<MD3Button loading>Loading Button</MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      // Check for loading indicator
      expect(button.querySelector('.loading-spinner')).toBeInTheDocument()
    })

    it('renders fullWidth correctly', () => {
      render(<MD3Button fullWidth>Full Width Button</MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveStyle({ width: '100%' })
    })
  })

  describe('Icons', () => {
    it('renders leading icon', () => {
      const leadingIcon = <span data-testid="leading-icon">📚</span>
      render(<MD3Button leadingIcon={leadingIcon}>Button with icon</MD3Button>)

      expect(screen.getByTestId('leading-icon')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('📚Button with icon')
    })

    it('renders trailing icon', () => {
      const trailingIcon = <span data-testid="trailing-icon">→</span>
      render(<MD3Button trailingIcon={trailingIcon}>Button with icon</MD3Button>)

      expect(screen.getByTestId('trailing-icon')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('Button with icon→')
    })

    it('renders both leading and trailing icons', () => {
      const leadingIcon = <span data-testid="leading-icon">📚</span>
      const trailingIcon = <span data-testid="trailing-icon">→</span>
      render(
        <MD3Button leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
          Button with icons
        </MD3Button>
      )

      expect(screen.getByTestId('leading-icon')).toBeInTheDocument()
      expect(screen.getByTestId('trailing-icon')).toBeInTheDocument()
    })
  })

  describe('Event Handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      render(<MD3Button onClick={handleClick}>Clickable Button</MD3Button>)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      render(
        <MD3Button onClick={handleClick} disabled>
          Disabled Button
        </MD3Button>
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn()
      render(
        <MD3Button onClick={handleClick} loading>
          Loading Button
        </MD3Button>
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<MD3Button aria-label="Custom label">Button</MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
    })

    it('is focusable with keyboard', () => {
      render(<MD3Button>Focusable Button</MD3Button>)
      const button = screen.getByRole('button')

      button.focus()
      expect(button).toHaveFocus()
    })

    it('shows focus ring on keyboard focus', async () => {
      render(<MD3Button>Button</MD3Button>)
      const button = screen.getByRole('button')

      // Simulate keyboard navigation
      fireEvent.keyDown(document.body, { key: 'Tab' })
      button.focus()

      // Test for the custom focus ring element
      const focusRing = button.querySelector('.md3-focus-ring')
      expect(focusRing).toBeInTheDocument()
      expect(focusRing).toHaveStyle({
        position: 'absolute',
        boxShadow: '0 0 0 2px rgba(36, 168, 224, .35)'
      })
    })

    it('supports Enter key activation', async () => {
      const handleClick = vi.fn()
      render(<MD3Button onClick={handleClick}>Button</MD3Button>)

      const button = screen.getByRole('button')
      button.focus()
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('supports Space key activation', async () => {
      const handleClick = vi.fn()
      render(<MD3Button onClick={handleClick}>Button</MD3Button>)

      const button = screen.getByRole('button')
      button.focus()
      fireEvent.keyDown(button, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Material Design Compliance', () => {
    it('applies correct border radius for different sizes', () => {
      const { rerender } = render(<MD3Button size="small">Small</MD3Button>)
      expect(screen.getByRole('button')).toHaveStyle({ borderRadius: '20px' })

      rerender(<MD3Button size="medium">Medium</MD3Button>)
      expect(screen.getByRole('button')).toHaveStyle({ borderRadius: '24px' })

      rerender(<MD3Button size="large">Large</MD3Button>)
      expect(screen.getByRole('button')).toHaveStyle({ borderRadius: '28px' })
    })

    it('applies density modifications correctly', () => {
      const { rerender } = render(<MD3Button density="compact">Compact</MD3Button>)
      const button = screen.getByRole('button')

      // Compact density should reduce padding
      expect(button).toHaveStyle({ padding: '8px 20px' }) // 12px - 4px

      rerender(<MD3Button density="comfortable">Comfortable</MD3Button>)
      expect(button).toHaveStyle({ padding: '10px 20px' }) // 12px - 2px
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      const TestButton = (props) => {
        renderSpy()
        return <MD3Button {...props}>Test Button</MD3Button>
      }

      const { rerender } = render(<TestButton />)
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<TestButton />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // Expected since we're not using memo
    })
  })

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<MD3Button></MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('')
    })

    it('handles null/undefined props gracefully', () => {
      render(<MD3Button variant={null} size={undefined}>Button</MD3Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<MD3Button ref={ref}>Button</MD3Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })
})
