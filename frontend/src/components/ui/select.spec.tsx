import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Select } from './select'

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

describe('Select', () => {
  describe('rendering', () => {
    it('renders all provided options', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('renders placeholder option when provided', () => {
      render(<Select options={defaultOptions} placeholder="Select an option" />)

      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    it('renders placeholder as disabled option', () => {
      render(<Select options={defaultOptions} placeholder="Select an option" />)

      const placeholderOption = screen.getByText('Select an option')
      expect(placeholderOption).toHaveAttribute('disabled')
    })

    it('renders chevron down icon', () => {
      render(<Select options={defaultOptions} />)

      // ChevronDown icon should be present (as an SVG)
      const wrapper = screen.getByText('Option 1').closest('div')
      expect(wrapper?.querySelector('svg')).toBeInTheDocument()
    })

    it('renders select element inside a relative div wrapper', () => {
      render(<Select options={defaultOptions} data-testid="select" />)

      const select = screen.getByTestId('select')
      const wrapper = select.parentElement
      expect(wrapper).toHaveClass('relative')
    })
  })

  describe('options', () => {
    it('has correct option values', () => {
      render(<Select options={defaultOptions} data-testid="select" />)

      const select = screen.getByTestId('select') as HTMLSelectElement
      const options = select.querySelectorAll('option')

      expect(options[0]).toHaveValue('option1')
      expect(options[1]).toHaveValue('option2')
      expect(options[2]).toHaveValue('option3')
    })

    it('displays correct option labels', () => {
      render(<Select options={defaultOptions} data-testid="select" />)

      const select = screen.getByTestId('select') as HTMLSelectElement
      const options = select.querySelectorAll('option')

      expect(options[0]).toHaveTextContent('Option 1')
      expect(options[1]).toHaveTextContent('Option 2')
      expect(options[2]).toHaveTextContent('Option 3')
    })
  })

  describe('interactions', () => {
    it('handles change events', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(<Select options={defaultOptions} onChange={handleChange} data-testid="select" />)

      const select = screen.getByTestId('select')
      await user.selectOptions(select, 'option2')

      expect(handleChange).toHaveBeenCalled()
    })

    it('updates value when option is selected', async () => {
      const user = userEvent.setup()

      render(<Select options={defaultOptions} data-testid="select" />)

      const select = screen.getByTestId('select') as HTMLSelectElement
      await user.selectOptions(select, 'option2')

      expect(select.value).toBe('option2')
    })

    it('can be disabled', () => {
      render(<Select options={defaultOptions} disabled data-testid="select" />)

      const select = screen.getByTestId('select')
      expect(select).toBeDisabled()
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLSelectElement>()

      render(<Select options={defaultOptions} ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLSelectElement)
    })
  })

  describe('variants', () => {
    it('applies default variant styles', () => {
      render(<Select options={defaultOptions} data-testid="select" />)

      const select = screen.getByTestId('select')
      expect(select).toHaveClass('border-input')
    })

    it('applies error variant styles', () => {
      render(<Select options={defaultOptions} variant="error" data-testid="select" />)

      const select = screen.getByTestId('select')
      expect(select).toHaveClass('border-destructive')
    })
  })

  describe('props', () => {
    it('accepts and applies custom className', () => {
      render(<Select options={defaultOptions} className="custom-class" data-testid="select" />)

      const select = screen.getByTestId('select')
      expect(select).toHaveClass('custom-class')
    })

    it('passes through additional HTML attributes', () => {
      render(
        <Select options={defaultOptions} name="my-select" id="select-id" data-testid="select" />,
      )

      const select = screen.getByTestId('select')
      expect(select).toHaveAttribute('name', 'my-select')
      expect(select).toHaveAttribute('id', 'select-id')
    })

    it('respects controlled value prop', () => {
      render(
        <Select
          options={defaultOptions}
          value="option2"
          onChange={() => {}}
          data-testid="select"
        />,
      )

      const select = screen.getByTestId('select') as HTMLSelectElement
      expect(select.value).toBe('option2')
    })

    it('respects defaultValue prop', () => {
      render(<Select options={defaultOptions} defaultValue="option3" data-testid="select" />)

      const select = screen.getByTestId('select') as HTMLSelectElement
      expect(select.value).toBe('option3')
    })
  })
})
