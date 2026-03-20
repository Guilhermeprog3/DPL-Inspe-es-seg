import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactNode
  iconBg: string
  value: string
  label: string
  delta?: { value: string; positive: boolean; neutral?: boolean }
}

export function MetricCard({ icon, iconBg, value, label, delta }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#dde3ec] p-[18px] flex items-start gap-3.5 shadow-[0_2px_8px_rgba(9,71,128,0.08)]">
      <div className={cn('w-[42px] h-[42px] rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div>
        <p className="font-condensed text-[28px] font-bold leading-none text-[#1a2535]">{value}</p>
        <p className="text-xs text-[#6b7a90] font-medium mt-0.5">{label}</p>
        {delta && (
          <p className={cn('text-[11px] font-semibold mt-1',
            delta.neutral ? 'text-[#939393]' :
            delta.positive ? 'text-green-600' : 'text-red-500'
          )}>
            {delta.value}
          </p>
        )}
      </div>
    </div>
  )
}
