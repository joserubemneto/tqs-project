import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export interface LabelProps extends ComponentProps<'label'> {
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={twMerge(
        'text-sm font-medium leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-error">*</span>}
    </label>
  )
}
