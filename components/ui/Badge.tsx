import { cn } from '@/lib/utils'

type BadgeVariant = 'ok' | 'alert' | 'error' | 'muted' | 'blue'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  ok:    'bg-green-500/10 text-green-600',
  alert: 'bg-[#E67A0E]/12 text-[#E67A0E]',
  error: 'bg-red-500/10 text-red-500',
  muted: 'bg-[#939393]/12 text-[#939393]',
  blue:  'bg-[#094780]/10 text-[#094780]',
}

const dotColors: Record<BadgeVariant, string> = {
  ok:    'bg-green-500',
  alert: 'bg-[#E67A0E]',
  error: 'bg-red-500',
  muted: 'bg-[#939393]',
  blue:  'bg-[#094780]',
}

export function Badge({ variant = 'muted', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
