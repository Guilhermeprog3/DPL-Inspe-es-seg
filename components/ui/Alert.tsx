import { cn } from '@/lib/utils'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

type AlertVariant = 'warning' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<AlertVariant, string> = {
  warning: 'bg-[#E67A0E]/10 text-[#b85f08] border-l-[3px] border-[#E67A0E]',
  info:    'bg-[#094780]/7 text-[#094780] border-l-[3px] border-[#094780]',
  success: 'bg-green-500/8 text-green-700 border-l-[3px] border-green-500',
}

const icons: Record<AlertVariant, React.ReactNode> = {
  warning: <AlertTriangle size={15} />,
  info:    <Info size={15} />,
  success: <CheckCircle size={15} />,
}

export function Alert({ variant = 'info', children, className }: AlertProps) {
  return (
    <div className={cn('flex items-start gap-2.5 px-4 py-3 rounded-lg text-sm font-medium', styles[variant], className)}>
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <div>{children}</div>
    </div>
  )
}
