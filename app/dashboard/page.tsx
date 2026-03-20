import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Badge, Alert } from '@/components/ui'
import { mockInspecoes, mockMetricas } from '@/lib/mock-data'
import { formatDateTime } from '@/lib/utils'
import { MetricCard } from '@/components/modules/MetricCard'
import { ConformidadeBar } from '@/components/modules/ConformidadeBar'
import {
  ClipboardList, CheckCircle, Briefcase, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

const statusMap = {
  aprovado:  { label: 'Aprovado',  variant: 'ok'    as const },
  atencao:   { label: 'Atenção',   variant: 'alert' as const },
  reprovado: { label: 'Reprovado', variant: 'error' as const },
  pendente:  { label: 'Pendente',  variant: 'muted' as const },
}

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard Geral"
      breadcrumb="SIGS / Dashboard / PI · Metropolitana"
    >
      <Alert variant="warning" className="mb-6">
        <strong>Atenção:</strong> 3 extintores com vencimento próximo na Regional Metropolitana — PI
      </Alert>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardList size={22} color="#094780" />}
          iconBg="bg-[#094780]/10"
          value="128"
          label="Inspeções no mês"
          delta={{ value: '↑ 12%', positive: true }}
        />
        <MetricCard
          icon={<CheckCircle size={22} color="#10b959" />}
          iconBg="bg-green-500/10"
          value="94%"
          label="Taxa de conformidade"
          delta={{ value: '↑ 2%', positive: true }}
        />
        <MetricCard
          icon={<Briefcase size={22} color="#E67A0E" />}
          iconBg="bg-[#E67A0E]/10"
          value="312"
          label="Equipamentos ativos"
          delta={{ value: 'PI + MA combinados', positive: true, neutral: true }}
        />
        <MetricCard
          icon={<AlertTriangle size={22} color="#ef4444" />}
          iconBg="bg-red-500/10"
          value="7"
          label="Não conformidades"
          delta={{ value: '↑ 3 novas esta semana', positive: false }}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Últimas inspeções */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Inspeções</CardTitle>
            <Link href="/inspecao" className="text-xs font-semibold text-[#094780] hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dde3ec]">
                  {['Equipamento', 'Inspetor', 'Status', 'Data'].map((h) => (
                    <th key={h} className="text-left pb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90] bg-[#f8fafc] px-3 first:pl-0 last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockInspecoes.map((ins) => {
                  const s = statusMap[ins.status]
                  return (
                    <tr key={ins.id} className="border-b border-[#dde3ec] last:border-0 hover:bg-[#f8faff]">
                      <td className="py-2.5 px-3 first:pl-0">
                        <p className="font-semibold">{ins.equipamentoCodigo}</p>
                      </td>
                      <td className="py-2.5 px-3 text-[#6b7a90]">{ins.inspetorNome}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={s.variant} dot>{s.label}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[#6b7a90] text-xs last:pr-0">
                        {formatDateTime(ins.data)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Conformidade por regional */}
        <Card>
          <CardHeader>
            <CardTitle>Conformidade por Regional</CardTitle>
          </CardHeader>
          <div className="space-y-3.5">
            {mockMetricas.map((m) => (
              <ConformidadeBar key={`${m.uf}-${m.regional}`} metrica={m} />
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
