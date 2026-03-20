'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, Button, Badge, Modal, Input, Select } from '@/components/ui'
import { mockEquipamentos } from '@/lib/mock-data'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { equipamentoSchema, type EquipamentoInput } from '@/lib/validations'
import { Plus } from 'lucide-react'

const statusVariant = {
  ativo:      'ok'    as const,
  manutencao: 'alert' as const,
  vencido:    'error' as const,
}
const statusLabel = { ativo: 'Ativo', manutencao: 'Em manutenção', vencido: 'Vencido' }

export default function EquipamentosPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [ufSel, setUfSel] = useState<UF | ''>('')
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<EquipamentoInput>({
    resolver: zodResolver(equipamentoSchema),
  })

  const equipamentosFiltrados = mockEquipamentos.filter((e) => {
    const matchBusca = e.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                       e.tipo.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = !tipoFiltro || e.tipo === tipoFiltro
    return matchBusca && matchTipo
  })

  async function onSubmit(data: EquipamentoInput) {
    console.log('Novo equipamento:', data)
    setModalOpen(false)
  }

  return (
    <DashboardLayout title="Equipamentos" breadcrumb="SIGS / Inventário / PI · Metropolitana">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-[#6b7a90]">
            Filtrado: PI · Metropolitana — <strong>{equipamentosFiltrados.length}</strong> itens
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Novo Equipamento
        </Button>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <Input
            placeholder="Buscar por ID ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 min-w-[180px]"
          />
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-[#dde3ec] rounded-lg text-sm text-[#1a2535] bg-white focus:outline-none focus:border-[#094780]"
          >
            <option value="">Todos os tipos</option>
            <option>Extintor PQS</option>
            <option>Extintor CO2</option>
            <option>Extintor Água</option>
            <option>Hidrante</option>
            <option>Sprinkler</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dde3ec] bg-[#f8fafc]">
                {['ID / UUID', 'Tipo', 'Ponto de Instalação', 'Fabricação', 'Próx. Inspeção', 'Status', 'Ação'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90] first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipamentosFiltrados.map((eq) => (
                <tr key={eq.id} className="border-b border-[#dde3ec] last:border-0 hover:bg-[#f8faff]">
                  <td className="px-3 py-3 first:pl-0">
                    <p className="font-bold">{eq.codigo}</p>
                    <p className="text-[10px] text-[#939393] font-mono">{eq.uuid.slice(0, 8)}</p>
                  </td>
                  <td className="px-3 py-3">{eq.tipo}</td>
                  <td className="px-3 py-3 text-[#6b7a90]">{eq.pontoInstalacao}</td>
                  <td className="px-3 py-3 text-[#6b7a90]">{formatDate(eq.fabricacao)}</td>
                  <td className="px-3 py-3">
                    <span className={eq.status === 'vencido' ? 'text-red-500 font-semibold text-xs' : 'text-[#6b7a90] text-xs'}>
                      {eq.status === 'vencido' ? 'Vencido' : formatDate(eq.proximaInspecao)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={statusVariant[eq.status]} dot>{statusLabel[eq.status]}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Button variant="ghost" size="sm">Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal novo equipamento */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Equipamento"
        subtitle="Preencha os dados para cadastrar no inventário"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" error={errors.tipo?.message} {...register('tipo')}>
              <option value="">Selecione...</option>
              <option>Extintor PQS</option>
              <option>Extintor CO2</option>
              <option>Extintor Água</option>
              <option>Hidrante</option>
              <option>Sprinkler</option>
            </Select>
            <Input label="Capacidade" placeholder="ex: 6kg, 10L" error={errors.capacidade?.message} {...register('capacidade')} />
          </div>
          <Input label="Ponto de Instalação" placeholder="ex: Corredor A — Bloco 2" error={errors.pontoInstalacao?.message} {...register('pontoInstalacao')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data de Fabricação" type="month" error={errors.fabricacao?.message} {...register('fabricacao')} />
            <Input label="Próxima Inspeção" type="date" error={errors.proximaInspecao?.message} {...register('proximaInspecao')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Estado (UF)"
              error={errors.uf?.message}
              value={ufSel}
              onChange={(e) => { setUfSel(e.target.value as UF); setValue('uf', e.target.value as UF); setValue('regional', '') }}
            >
              <option value="">Selecione...</option>
              <option value="PI">PI — Piauí</option>
              <option value="MA">MA — Maranhão</option>
            </Select>
            <Select label="Regional" disabled={!ufSel} error={errors.regional?.message} {...register('regional')}>
              <option value="">{ufSel ? 'Selecione...' : 'Selecione o estado'}</option>
              {ufSel && REGIONAIS_POR_UF[ufSel].map((r) => <option key={r}>{r}</option>)}
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar Equipamento</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
