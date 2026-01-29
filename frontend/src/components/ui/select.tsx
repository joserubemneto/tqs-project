import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const selectVariants = tv({
  base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
  variants: {
    variant: {
      default: '',
      error: 'border-destructive focus:ring-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select className={selectVariants({ variant, className })} ref={ref} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select, selectVariants }
