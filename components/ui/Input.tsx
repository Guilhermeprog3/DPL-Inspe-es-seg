import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2.5 border-[1.5px] border-[#dde3ec] rounded-lg text-sm font-barlow text-[#1a2535] bg-white',
            'focus:outline-none focus:border-[#094780] transition-colors',
            'disabled:bg-[#f5f7fa] disabled:text-[#939393] disabled:cursor-not-allowed',
            error && 'border-red-400 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
