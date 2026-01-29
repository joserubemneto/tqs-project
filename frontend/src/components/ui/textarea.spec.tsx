import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Textarea } from './textarea'

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox', { name: /test textarea/i })).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'textarea')
  })

  it('accepts and displays text input', async () => {
    const user = userEvent.setup()
    render(<Textarea aria-label="Test textarea" />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello, World!')

    expect(textarea).toHaveValue('Hello, World!')
  })

  it('handles multiline input', async () => {
    const user = userEvent.setup()
    render(<Textarea aria-label="Test textarea" />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3')

    expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3')
  })

  it('calls onChange when text is entered', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Textarea aria-label="Test textarea" onChange={handleChange} />)
    await user.type(screen.getByRole('textbox'), 'abc')

    expect(handleChange).toHaveBeenCalledTimes(3) // Once per character
  })

  it('is disabled when disabled prop is true', () => {
    render(<Textarea aria-label="Test textarea" disabled />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveAttribute('data-disabled', '')
  })

  it('does not have data-disabled when not disabled', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-disabled')
  })

  it('does not allow input when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Textarea aria-label="Test textarea" disabled onChange={handleChange} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'test')

    expect(handleChange).not.toHaveBeenCalled()
    expect(textarea).toHaveValue('')
  })

  it('has data-error attribute when error prop is true', () => {
    render(<Textarea aria-label="Test textarea" error />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-error', '')
  })

  it('does not have data-error when error prop is false', () => {
    render(<Textarea aria-label="Test textarea" error={false} />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-error')
  })

  it('does not have data-error when error prop is undefined', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-error')
  })

  it('applies error styling when error is true', () => {
    render(<Textarea aria-label="Test textarea" error />)
    // The error styling is applied via data-error attribute and CSS
    expect(screen.getByRole('textbox')).toHaveAttribute('data-error', '')
  })

  it('applies default variant class', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-border')
  })

  it('applies custom className', () => {
    render(<Textarea aria-label="Test textarea" className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('merges custom className with default classes', () => {
    render(<Textarea aria-label="Test textarea" className="my-custom-class" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('my-custom-class')
    expect(textarea).toHaveClass('rounded-lg') // From base styles
  })

  it('renders with placeholder text', () => {
    render(<Textarea placeholder="Enter your bio..." aria-label="Test textarea" />)
    expect(screen.getByPlaceholderText('Enter your bio...')).toBeInTheDocument()
  })

  it('renders with initial value', () => {
    render(<Textarea aria-label="Test textarea" defaultValue="Initial text" />)
    expect(screen.getByRole('textbox')).toHaveValue('Initial text')
  })

  it('renders with controlled value', () => {
    render(<Textarea aria-label="Test textarea" value="Controlled text" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('Controlled text')
  })

  it('applies rows attribute', () => {
    render(<Textarea aria-label="Test textarea" rows={5} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })

  it('applies cols attribute', () => {
    render(<Textarea aria-label="Test textarea" cols={40} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('cols', '40')
  })

  it('applies maxLength attribute', () => {
    render(<Textarea aria-label="Test textarea" maxLength={500} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500')
  })

  it('respects maxLength constraint', async () => {
    const user = userEvent.setup()
    render(<Textarea aria-label="Test textarea" maxLength={5} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello World')

    expect(textarea).toHaveValue('Hello') // Only first 5 characters
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Textarea aria-label="Test textarea" ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('applies name attribute', () => {
    render(<Textarea aria-label="Test textarea" name="bio" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'bio')
  })

  it('applies id attribute', () => {
    render(<Textarea id="bio-input" aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'bio-input')
  })

  it('applies required attribute', () => {
    render(<Textarea aria-label="Test textarea" required />)
    expect(screen.getByRole('textbox')).toBeRequired()
  })

  it('applies readOnly attribute', () => {
    render(<Textarea aria-label="Test textarea" readOnly defaultValue="Read only text" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('readonly')
  })

  it('handles focus and blur events', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()

    render(<Textarea aria-label="Test textarea" onFocus={handleFocus} onBlur={handleBlur} />)

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('has base styling classes', () => {
    render(<Textarea aria-label="Test textarea" />)
    const textarea = screen.getByRole('textbox')

    expect(textarea).toHaveClass('flex')
    expect(textarea).toHaveClass('w-full')
    expect(textarea).toHaveClass('rounded-lg')
    expect(textarea).toHaveClass('border')
    expect(textarea).toHaveClass('bg-surface')
    expect(textarea).toHaveClass('px-3')
    expect(textarea).toHaveClass('py-2')
    expect(textarea).toHaveClass('text-sm')
  })

  it('has minimum height styling', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[80px]')
  })

  it('has resize-y styling for vertical resizing', () => {
    render(<Textarea aria-label="Test textarea" />)
    expect(screen.getByRole('textbox')).toHaveClass('resize-y')
  })
})
