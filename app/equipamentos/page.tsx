'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, Button, Badge, Modal, Input, Select } from '@/components/ui'
import { mockEquipamentos } from '@/lib/mock-data'
import { REGIONAIS_POR_UF, type UF, type Equipamento } from '@/types'
import { formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { equipamentoSchema, type EquipamentoInput } from '@/lib/validations'
import { Plus, Search, QrCode, Printer, MapPin, CheckSquare, Square, XCircle } from 'lucide-react'

import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })

const statusVariant = {
  ativo: 'ok' as const,
  manutencao: 'alert' as const,
  vencido: 'error' as const,
}

const statusLabel = { ativo: 'Ativo', manutencao: 'Em manutenção', vencido: 'Vencido' }

export default function EquipamentosPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EquipamentoInput>({
    resolver: zodResolver(equipamentoSchema),
  })

  // Lógica de seleção
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === equipamentosFiltrados.length) setSelectedIds([])
    else setSelectedIds(equipamentosFiltrados.map(e => e.id))
  }

  const equipamentosFiltrados = (mockEquipamentos as Equipamento[]).filter((e) => {
    const termo = busca.toLowerCase();
    return (
      e.codigo.toLowerCase().includes(termo) || 
      e.uuid.toLowerCase().includes(termo) ||
      e.tipo.toLowerCase().includes(termo) ||
      e.base.toLowerCase().includes(termo)
    );
  })

  const selectedEquipamentos = (mockEquipamentos as Equipamento[]).filter(e => selectedIds.includes(e.id))

  return (
    <DashboardLayout title="Equipamentos" breadcrumb="SIGS / Inventário">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');
        
        .label-title-area { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(9,71,128,0.1); border-radius: 100px; padding: 4px 10px 4px 6px; margin-bottom: 8px; }
        .label-logo-icon { width: 18px; height: 18px; border-radius: 4px; background: linear-gradient(135deg, #094780, #1a6ab5); display: flex; align-items: center; justify-content: center; }
        .label-title-text { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 800; color: #094780; letter-spacing: 1.2px; }

        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute;
            left: 0; top: 0; width: 100%;
            display: flex; flex-wrap: wrap;
            gap: 10mm; padding: 10mm;
          }
          .etiqueta-single { break-inside: avoid; border: 1px solid #eee !important; }
          @page { margin: 0; size: auto; }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1e33] tracking-tight">Gestão de Inventário</h1>
          <p className="text-sm text-[#6b7a90]">
            {selectedIds.length > 0 ? `${selectedIds.length} selecionados` : `Total de ${equipamentosFiltrados.length} itens`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="orange" onClick={() => setQrModalOpen(true)} className="gap-2 shadow-lg shadow-orange-500/20">
              <QrCode size={18} /> Gerar Etiquetas ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={18} /> Novo Equipamento
          </Button>
        </div>
      </div>

      <Card>
        {/* BUSCA */}
        <div className="p-4 border-b border-[#dde3ec]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896ab]" size={16} />
            <Input placeholder="Filtrar por código, ID, base..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dde3ec] bg-[#f8fafc]">
                <th className="px-4 py-4 text-left w-10">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === equipamentosFiltrados.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                {['ID / UUID', 'Tipo', 'Base', 'Ponto de Instalação', 'Fabricação', 'Próx. Inspeção', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipamentosFiltrados.map((eq) => (
                <tr key={eq.id} className={`border-b border-[#dde3ec] transition-colors ${selectedIds.includes(eq.id) ? 'bg-blue-50/50' : 'hover:bg-[#f8faff]'}`}>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleSelect(eq.id)}>
                      {selectedIds.includes(eq.id) ? <CheckSquare size={18} className="text-[#094780]" /> : <Square size={18} className="text-[#aab4c4]" />}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-[#094780]">{eq.codigo}</p>
                    <p className="text-[10px] text-[#939393] font-mono">{eq.uuid.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-4 font-medium">{eq.tipo}</td>
                  <td className="px-4 py-4 font-semibold text-[#1a2535]">{eq.base}</td>
                  <td className="px-4 py-4 text-[#6b7a90]">{eq.pontoInstalacao}</td>
                  <td className="px-4 py-4 text-[#6b7a90]">{formatDate(eq.fabricacao)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold ${eq.status === 'vencido' ? 'text-red-500' : 'text-[#6b7a90]'}`}>
                      {eq.status === 'vencido' ? 'Vencido' : formatDate(eq.proximaInspecao)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariant[eq.status]} dot>{statusLabel[eq.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL MULTI-ETIQUETAS */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Gerar Etiquetas em Lote">
        <div className="flex flex-col items-center">
          <div id="print-area" className="flex flex-wrap justify-center gap-4 max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-xl">
            {selectedEquipamentos.map((eq) => (
              <div key={eq.id} className="etiqueta-single border-[1.5px] border-[#dde3ec] rounded-2xl p-5 text-center bg-white w-[210px] shadow-sm flex flex-col items-center">
                <div className="label-title-area">
                  <div className="label-logo-icon"><QrCode size={10} color="#fff" /></div>
                  <span className="label-title-text">SIGS</span>
                  <span className="text-[7px] font-bold bg-[#E67A0E]/10 text-[#E67A0E] px-1.5 py-0.5 rounded-full">v2.0</span>
                </div>
                <div className="bg-white p-2 border border-[#f1f5f9] rounded-xl mb-3">
                  <QRCodeSVG value={`${window.location.origin}/inspecao/nova?id=${eq.uuid}`} size={110} level="H" />
                </div>
                <p className="text-[16px] font-black text-[#0d1e33] leading-none uppercase">{eq.codigo}</p>
                <p className="text-[10px] font-bold text-[#094780] uppercase mt-1">{eq.tipo}</p>
                <div className="w-full pt-2 mt-2 border-t border-[#f1f5f9] space-y-1">
                  <p className="text-[9px] text-[#1a2535]"><strong>BASE:</strong> {eq.base}</p>
                  <div className="flex items-center justify-center gap-1 text-[8px] text-[#8896ab] italic">
                    <MapPin size={8} /> {eq.pontoInstalacao}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 w-full space-y-2">
            <Button className="w-full h-12 gap-2" onClick={() => window.print()}>
              <Printer size={18} /> Imprimir {selectedIds.length} Etiquetas
            </Button>
            <Button variant="ghost" className="w-full text-[#6b7a90]" onClick={() => setQrModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL NOVO EQUIPAMENTO (RESTAURADO) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Equipamento">
        <form className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo"><option value="">Selecione...</option><option>Extintor PQS</option></Select>
            <Input label="Capacidade" placeholder="ex: 6kg" />
          </div>
          <Input label="Ponto de Instalação" placeholder="ex: Corredor A - Bloco 2" />
          <div className="grid grid-cols-3 gap-3">
            <Select label="UF"><option value="PI">PI</option><option value="MA">MA</option></Select>
            <Select label="Regional"><option value="">Selecione...</option></Select>
            <Input label="Base" placeholder="Unidade" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data de Fabricação" type="month" />
            <Input label="Próxima Inspeção" type="date" />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar Equipamento</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}