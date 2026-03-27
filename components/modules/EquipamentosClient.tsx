'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, Button, Badge, Modal, Input, Select } from '@/components/ui'
import { type Equipamento } from '@/types'
import { formatDate } from '@/lib/utils'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { equipamentoSchema, type EquipamentoInput } from '@/lib/validations'
import { 
  Plus, Search, QrCode, Printer, MapPin, 
  CheckSquare, Square, FilterX, Calendar, Hash 
} from 'lucide-react'
import dynamic from 'next/dynamic'

const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })

const statusVariant = {
  ativo: 'ok' as const,
  manutencao: 'alert' as const,
  vencido: 'error' as const,
}

const statusLabel = { ativo: 'Ativo', manutencao: 'Em manutenção', vencido: 'Vencido' }

interface EquipamentosClientProps {
  initialData: Equipamento[]
}

export default function EquipamentosClient({ initialData }: EquipamentosClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [filtros, setFiltros] = useState({
    codigo: '',
    codigoGalao: '',
    base: '',
    ponto: '',
    status: '',
    dataProxima: ''
  })

  const { register, handleSubmit, control, reset } = useForm<EquipamentoInput>({
    resolver: zodResolver(equipamentoSchema),
    defaultValues: { tipo: '', codigo: '', codigoGalao: '' } as any
  })

  const tipoSelecionado = useWatch({ control, name: 'tipo' });
  const isExtintor = tipoSelecionado?.toLowerCase().includes('extintor');

  const equipamentosFiltrados = useMemo(() => {
    return initialData.filter((e) => {
      const matchCodigo = e.codigo.toLowerCase().includes(filtros.codigo.toLowerCase()) || 
                          e.uuid.toLowerCase().includes(filtros.codigo.toLowerCase());
      const matchGalao = !filtros.codigoGalao || 
                         (e.codigoGalao && e.codigoGalao.toLowerCase().includes(filtros.codigoGalao.toLowerCase()));
      const matchBase = filtros.base === '' || e.base === filtros.base;
      const matchPonto = e.pontoInstalacao.toLowerCase().includes(filtros.ponto.toLowerCase());
      const matchStatus = filtros.status === '' || e.status === filtros.status;
      const matchData = filtros.dataProxima === '' || e.proximaInspecao.includes(filtros.dataProxima);

      return matchCodigo && matchGalao && matchBase && matchPonto && matchStatus && matchData;
    })
  }, [filtros, initialData])

  const selectedEquipamentos = initialData.filter(e => selectedIds.includes(e.id))

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === equipamentosFiltrados.length) setSelectedIds([])
    else setSelectedIds(equipamentosFiltrados.map(e => e.id))
  }

  const resetFiltros = () => setFiltros({ codigo: '', codigoGalao: '', base: '', ponto: '', status: '', dataProxima: '' })

  return (
    <DashboardLayout title="Equipamentos" breadcrumb="SIGS / Inventário">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');
        .label-title-area { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid rgba(9,71,128,0.1); border-radius: 100px; padding: 6px 12px; margin-bottom: 12px; }
        .label-logo-icon { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, #094780, #1a6ab5); display: flex; align-items: center; justify-content: center; }
        .label-title-text { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800; color: #094780; letter-spacing: 1.5px; }
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
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
          <Button onClick={() => { reset(); setModalOpen(true); }} className="gap-2">
            <Plus size={18} /> Novo Equipamento
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <div className="p-5 border-b border-[#dde3ec] bg-[#f8fafc]/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-[#8896ab] ml-1 tracking-wider">Cód. Sistema</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896ab]" size={14} />
                <Input placeholder="EXT-..." value={filtros.codigo} onChange={(e) => setFiltros({...filtros, codigo: e.target.value})} className="pl-9 h-10 text-xs" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-[#8896ab] ml-1 tracking-wider">Cilindro / Galão</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896ab]" size={14} />
                <Input placeholder="Série cilindro" value={filtros.codigoGalao} onChange={(e) => setFiltros({...filtros, codigoGalao: e.target.value})} className="pl-9 h-10 text-xs" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-[#8896ab] ml-1 tracking-wider">Unidade</label>
              <Select className="h-10 text-xs" value={filtros.base} onChange={(e) => setFiltros({...filtros, base: e.target.value})}>
                <option value="">Todas</option>
                {Array.from(new Set(initialData.map(m => m.base))).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-[#8896ab] ml-1 tracking-wider">Localização</label>
              <Input className="h-10 text-xs" placeholder="Ponto de Inst..." value={filtros.ponto} onChange={(e) => setFiltros({...filtros, ponto: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-[#8896ab] ml-1 tracking-wider">Status</label>
              <Select className="h-10 text-xs" value={filtros.status} onChange={(e) => setFiltros({...filtros, status: e.target.value})}>
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="manutencao">Manutenção</option>
                <option value="vencido">Vencido</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-blue-600 ml-1 tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Próx. Inspeção
              </label>
              <Input type="date" className="h-10 text-xs border-blue-100" value={filtros.dataProxima} onChange={(e) => setFiltros({...filtros, dataProxima: e.target.value})} />
            </div>
          </div>

          {Object.values(filtros).some(v => v !== '') && (
            <button onClick={resetFiltros} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:underline">
              <FilterX size={14} /> Limpar filtros
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dde3ec] bg-[#f8fafc]">
                <th className="px-4 py-4 text-left w-10">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === equipamentosFiltrados.length && equipamentosFiltrados.length > 0 
                      ? <CheckSquare size={18} className="text-[#094780]" /> 
                      : <Square size={18} className="text-[#aab4c4]" />
                    }
                  </button>
                </th>
                <th className="text-left px-4 py-4 text-[11px] font-bold uppercase text-[#6b7a90]">Identificação</th>
                <th className="text-left px-4 py-4 text-[11px] font-bold uppercase text-[#6b7a90]">Tipo</th>
                <th className="text-left px-4 py-4 text-[11px] font-bold uppercase text-[#6b7a90]">Base / Unidade</th>
                <th className="text-left px-4 py-4 text-[11px] font-bold uppercase text-[#6b7a90]">Instalação</th>
                <th className="text-left px-4 py-4 text-[11px] font-bold uppercase text-[#6b7a90]">Próx. Inspeção</th>
                <th className="text-left px-4 py-4 text-[11px] font-bold uppercase text-[#6b7a90]">Status</th>
              </tr>
            </thead>
            <tbody>
              {equipamentosFiltrados.map((eq) => (
                <tr key={eq.id} className={`border-b border-[#dde3ec] transition-colors ${selectedIds.includes(eq.id) ? 'bg-blue-50/50' : 'hover:bg-[#f8faff]'}`}>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => toggleSelect(eq.id)}>
                      {selectedIds.includes(eq.id) ? <CheckSquare size={18} className="text-[#094780]" /> : <Square size={18} className="text-[#aab4c4]" />}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-[#094780]">{eq.codigo}</p>
                    {eq.codigoGalao && (
                      <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1 mt-0.5">
                        <Hash size={10} /> {eq.codigoGalao}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-700">{eq.tipo}</td>
                  <td className="px-4 py-4 font-bold text-gray-900">{eq.base}</td>
                  <td className="px-4 py-4 text-[#8896ab]">{eq.pontoInstalacao}</td>
                  <td className="px-4 py-4">
                    <span className={eq.status === 'vencido' ? 'text-red-500 font-bold' : 'text-gray-500'}>
                      {eq.status === 'vencido' ? 'Vencido' : formatDate(eq.proximaInspecao)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariant[eq.status as keyof typeof statusVariant]} dot>{statusLabel[eq.status as keyof typeof statusLabel]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modais de Cadastro e Etiquetas mantêm-se como no seu código original */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Equipamento">
        <form className="space-y-5 pt-2" onSubmit={handleSubmit((data) => console.log(data))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Tipo de Equipamento" {...register('tipo')}>
              <option value="">Selecione...</option>
              <option value="Extintor PQS">Extintor PQS</option>
              <option value="Extintor CO2">Extintor CO2</option>
              <option value="Hidrante">Hidrante</option>
              <option value="Luminária">Luminária de Emergência</option>
            </Select>
            <Input label="Código no Sistema" placeholder="ex: EXT-001" {...register('codigo')} />
          </div>

          {isExtintor && (
            <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 space-y-4">
              <div className="flex items-center gap-2 text-[#094780] text-[10px] font-bold uppercase tracking-widest">
                <Hash size={14} /> Dados Técnicos do Cilindro
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nº de Série (Cilindro)" placeholder="Cód. do Galão" {...register('codigoGalao')} />
                <Input label="Capacidade" placeholder="ex: 6kg / 10L" />
              </div>
            </div>
          )}

          <Input label="Ponto de Instalação" placeholder="ex: Corredor A - Bloco 2" />
          <div className="grid grid-cols-3 gap-3">
            <Select label="UF"><option value="PI">PI</option><option value="MA">MA</option></Select>
            <Select label="Regional"><option value="">Selecione...</option></Select>
            <Input label="Base" placeholder="Unidade" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de Fabricação" type="month" />
            <Input label="Próxima Inspeção" type="date" />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 no-print">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar Equipamento</Button>
          </div>
        </form>
      </Modal>

      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Gerar Etiquetas">
        <div className="flex flex-col items-center">
          <div id="print-area" className="flex flex-wrap justify-center gap-4 p-4 bg-gray-50 rounded-xl">
            {selectedEquipamentos.map((eq) => (
              <div key={eq.id} className="etiqueta-single border-[1.5px] border-[#dde3ec] p-10 text-center bg-white">
                <div className="label-title-area scale-125 mb-8">
                  <div className="label-logo-icon"><QrCode size={14} color="#fff" /></div>
                  <span className="label-title-text text-[14px]">SIGS</span>
                </div>
                <QRCodeSVG 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/inspecao/nova?id=${eq.uuid}`} 
                  size={240} level="H" 
                />
                <p className="text-[42px] font-black text-[#0d1e33] mt-8 uppercase leading-none tracking-tight">{eq.codigo}</p>
                <p className="text-[20px] font-bold text-[#094780] uppercase mt-3 tracking-wide">{eq.tipo}</p>
                <div className="w-full pt-6 mt-8 border-t-[0.5mm] border-[#f1f5f9]">
                   <p className="text-[22px] font-black uppercase text-gray-800 leading-tight">{eq.base}</p>
                   <p className="text-[16px] text-gray-500 font-semibold italic flex items-center justify-center gap-2 mt-2">
                     <MapPin size={16}/> {eq.pontoInstalacao}
                   </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 w-full space-y-2 no-print">
            <Button className="w-full h-12 gap-2" onClick={() => window.print()}><Printer size={18} /> Imprimir</Button>
            <Button variant="ghost" className="w-full text-[#6b7a90]" onClick={() => setQrModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}