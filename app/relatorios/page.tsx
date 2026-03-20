'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Badge, Button, Alert } from '@/components/ui'
import { MetricCard } from '@/components/modules/MetricCard'
import { mockMetricas } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ClipboardList, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

type Tab = 'visao-geral' | 'conformidade' | 'mapa'
const tabs: { id: Tab; label: string }[] = [
  { id: 'visao-geral',   label: 'Visão Geral' },
  { id: 'conformidade',  label: 'Conformidade' },
  { id: 'mapa',          label: 'Mapa de Calor' },
]

const mesesData = [
  { mes: 'Jan', val: 70 }, { mes: 'Fev', val: 85 }, { mes: 'Mar', val: 60 },
  { mes: 'Abr', val: 92 }, { mes: 'Mai', val: 100 }, { mes: 'Jun', val: 45 },
]

export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('visao-geral')

  return (
    <DashboardLayout title="Relatórios" breadcrumb="SIGS / Analytics">
      {/* Tabs */}
      <div className="flex border-b-2 border-[#dde3ec] mb-6 gap-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors',
              tab === t.id
                ? 'text-[#094780] border-[#094780]'
                : 'text-[#6b7a90] border-transparent hover:text-[#1a2535]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Visão Geral */}
      {tab === 'visao-geral' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <MetricCard icon={<ClipboardList size={20} color="#094780" />} iconBg="bg-[#094780]/10" value="1.247" label="Total inspeções (ano)" />
            <MetricCard icon={<CheckCircle size={20} color="#10b959" />} iconBg="bg-green-500/10" value="92%" label="Conformidade média" />
            <MetricCard icon={<AlertTriangle size={20} color="#E67A0E" />} iconBg="bg-[#E67A0E]/10" value="48" label="Não conformidades" />
            <MetricCard icon={<Clock size={20} color="#094780" />} iconBg="bg-[#094780]/10" value="4,2h" label="Tempo médio/inspeção" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Inspeções por Mês — 2025</CardTitle>
              <Button variant="ghost" size="sm">Exportar PDF</Button>
            </CardHeader>
            <div className="flex items-end gap-2 h-32 px-1">
              {mesesData.map(({ mes, val }, i) => {
                const isCurrent = i === 4
                return (
                  <div key={mes} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${val}%`,
                        background: isCurrent ? '#E67A0E' : i < 3 ? '#094780' : '#1a6ab5',
                        opacity: i === 5 ? 0.45 : 1,
                      }}
                    />
                    <span className="text-[10px] text-[#6b7a90]">{mes}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Conformidade */}
      {tab === 'conformidade' && (
        <div className="space-y-4">
          <Alert variant="success">
            Meta de 90% atingida em todas as regionais de PI. MA · Noroeste precisa de atenção.
          </Alert>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#dde3ec]">
                    {['Estado', 'Regional', 'Equipamentos', 'Inspeções', 'Conformidade', 'Última NC'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockMetricas.map((m) => {
                    const pct = m.percentualConformidade
                    const color = pct >= 90 ? 'text-green-600' : pct >= 80 ? 'text-[#094780]' : pct >= 70 ? 'text-[#E67A0E]' : 'text-red-500'
                    return (
                      <tr key={`${m.uf}-${m.regional}`} className="border-b border-[#dde3ec] last:border-0 hover:bg-[#f8faff]">
                        <td className="px-4 py-3 font-semibold">{m.uf}</td>
                        <td className="px-4 py-3">{m.regional}</td>
                        <td className="px-4 py-3 text-[#6b7a90]">{m.totalEquipamentos}</td>
                        <td className="px-4 py-3 text-[#6b7a90]">{m.totalInspecoes}</td>
                        <td className="px-4 py-3 font-bold"><span className={color}>{pct}%</span></td>
                        <td className="px-4 py-3 text-[#6b7a90] text-xs">
                          {m.ultimaNaoConformidade ? formatDate(m.ultimaNaoConformidade) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Mapa de calor */}
      {tab === 'mapa' && (
        <Card>
          <CardHeader><CardTitle>Mapa de Calor — Conformidade por Estado</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4">
            {(['PI', 'MA'] as const).map((uf) => {
              const regionais = mockMetricas.filter((m) => m.uf === uf)
              return (
                <div key={uf} className="bg-[#f0f4f8] rounded-xl p-5">
                  <p className="font-condensed text-xl font-bold text-[#094780] mb-3">
                    {uf} — {uf === 'PI' ? 'Piauí' : 'Maranhão'}
                  </p>
                  <div className="space-y-2">
                    {regionais.map((m) => {
                      const pct = m.percentualConformidade
                      const bg = pct >= 90 ? 'bg-green-500/12 text-green-600' :
                                 pct >= 80 ? 'bg-[#094780]/7 text-[#094780]' :
                                 pct >= 70 ? 'bg-[#E67A0E]/10 text-[#E67A0E]' :
                                             'bg-red-500/10 text-red-500'
                      return (
                        <div key={m.regional} className={cn('flex justify-between px-3 py-2 rounded-lg text-sm font-semibold', bg)}>
                          <span>{m.regional}</span>
                          <span>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}
