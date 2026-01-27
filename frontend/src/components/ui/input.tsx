import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

export const inputVariants = tv({
  base: [
    'flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm transition-colors',
    'placeholder:text-muted',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary-500',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
    'data-[error]:border-error data-[error]:focus-visible:ring-error',
  ],
  variants: {
    variant: {
      default: 'border-border',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface InputProps extends ComponentProps<'input'>, VariantProps<typeof inputVariants> {
  error?: boolean
}

export function Input({ className, variant, error, disabled, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      data-disabled={disabled ? '' : undefined}
      data-error={error ? '' : undefined}
      className={twMerge(inputVariants({ variant }), className)}
      disabled={disabled}
      {...props}
    />
  )
}
