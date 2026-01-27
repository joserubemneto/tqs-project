import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

export const buttonVariants = tv({
  base: [
    'inline-flex cursor-pointer items-center justify-center gap-2 font-medium rounded-lg transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ],
  variants: {
    variant: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
      outline: 'border border-border bg-transparent hover:bg-surface-elevated',
      ghost: 'bg-transparent hover:bg-surface-elevated',
      destructive: 'bg-error text-white hover:bg-error/90',
    },
    size: {
      sm: 'h-8 px-3 text-sm [&_svg]:size-3.5',
      md: 'h-10 px-4 text-sm [&_svg]:size-4',
      lg: 'h-12 px-6 text-base [&_svg]:size-5',
      icon: 'h-10 w-10 [&_svg]:size-4',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      data-slot="button"
      data-disabled={disabled || loading ? '' : undefined}
      className={twMerge(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  )
}
