import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

export const textareaVariants = tv({
  base: [
    'flex min-h-[80px] w-full rounded-lg border bg-surface px-3 py-2 text-sm transition-colors resize-y',
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

export interface TextareaProps
  extends ComponentProps<'textarea'>,
    VariantProps<typeof textareaVariants> {
  error?: boolean
}

export function Textarea({ className, variant, error, disabled, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-disabled={disabled ? '' : undefined}
      data-error={error ? '' : undefined}
      className={twMerge(textareaVariants({ variant }), className)}
      disabled={disabled}
      {...props}
    />
  )
}
