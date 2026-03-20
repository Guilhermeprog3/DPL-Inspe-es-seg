import { cn } from '@/lib/utils'
import type { MetricaConformidade } from '@/types'

interface ConformidadeBarProps {
  metrica: MetricaConformidade
}

export function ConformidadeBar({ metrica }: ConformidadeBarProps) {
  const pct = metrica.percentualConformidade

  const color =
    pct >= 90 ? { bar: '#10b959', text: 'text-green-600' } :
    pct >= 80 ? { bar: '#094780', text: 'text-[#094780]' } :
    pct >= 70 ? { bar: '#E67A0E', text: 'text-[#E67A0E]' } :
                { bar: '#ef4444', text: 'text-red-500' }

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-[#1a2535]">
          {metrica.uf} · {metrica.regional}
        </span>
        <span className={cn('text-sm font-bold', color.text)}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color.bar }}
        />
      </div>
    </div>
  )
}
