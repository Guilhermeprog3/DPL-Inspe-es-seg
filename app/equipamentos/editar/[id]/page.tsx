'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
  Package, MapPin, Wrench, FileText,
  Flame, Droplets, Waves, Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos / Config ───────────────────────────────────────────────────────────
type StatusEquip = 'ativo' | 'vencido' | 'manutencao' | 'inativo'

const STATUS_OPTIONS: { value: StatusEquip; label: string; color: string }[] = [
  { value: 'ativo',      label: 'Ativo',      color: '#059669' },
  { value: 'vencido',    label: 'Vencido',    color: '#d97706' },
  { value: 'manutencao', label: 'Manutenção', color: '#dc2626' },
  { value: 'inativo',    label: 'Inativo',    color: '#6b7280' },
]

const TIPO_OPTIONS = ['Extintor', 'Hidrante', 'Sprinkler', 'Detector']

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Extintor':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Sprinkler': { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff', icon: Waves    },
  'Detector':  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Radio    },
}

// ─── Mock fetch ───────────────────────────────────────────────────────────────
const MOCK_EQUIP = {
  id: 'EQ-9921', nome: 'Extintor CO₂ – Bloco A', tipo: 'Extintor',
  local: 'Bloco A – Térreo', regional: 'Metropolitana', fabricante: 'Amerex',
  modelo: 'B260', capacidade: '6 kg', agente: 'CO₂', numeroSerie: 'AMX-2024-9921',
  dataFabricacao: '2022-04-15', ultimaRecarga: '2024-11-20', proximaRecarga: '2026-11-20',
  ultimaInspecao: '2026-03-19', proximaInspecao: '2026-09-19',
  status: 'ativo' as StatusEquip, observacoes: 'Equipamento fixado na parede lateral esquerda.',
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'identificacao'   as const, label: 'Identificação',   icon: Package  },
  { key: 'especificacoes'  as const, label: 'Especificações',  icon: Wrench   },
  { key: 'datas'           as const, label: 'Datas',           icon: FileText },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditarEquipamentoPage() {
  const router  = useRouter()
  const params  = useParams()
  const { data: session } = useSession()

  // Se não tiver params.id, é criação; se tiver, é edição
  const id        = params?.id as string | undefined
  const isEdicao  = !!id

  const [loading, setLoading]     = useState(isEdicao)
  const [isSaving, setIsSaving]   = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [tab, setTab]             = useState<TabKey>('identificacao')

  // ── Campos do formulário ──
  const [nome, setNome]                       = useState('')
  const [tipo, setTipo]                       = useState('')
  const [local, setLocal]                     = useState('')
  const [regional, setRegional]               = useState('')
  const [status, setStatus]                   = useState<StatusEquip>('ativo')
  const [observacoes, setObservacoes]         = useState('')

  const [fabricante, setFabricante]           = useState('')
  const [modelo, setModelo]                   = useState('')
  const [numeroSerie, setNumeroSerie]         = useState('')
  const [capacidade, setCapacidade]           = useState('')
  const [agente, setAgente]                   = useState('')

  const [dataFabricacao, setDataFabricacao]   = useState('')
  const [ultimaRecarga, setUltimaRecarga]     = useState('')
  const [proximaRecarga, setProximaRecarga]   = useState('')
  const [ultimaInspecao, setUltimaInspecao]   = useState('')
  const [proximaInspecao, setProximaInspecao] = useState('')

  // ── Fetch (edição) ──
  useEffect(() => {
    if (!isEdicao) return
    const fetch_ = async () => {
      setLoading(true)
      try {
        await new Promise(r => setTimeout(r, 500))
        const d = MOCK_EQUIP
        setNome(d.nome); setTipo(d.tipo); setLocal(d.local); setRegional(d.regional)
        setStatus(d.status); setObservacoes(d.observacoes)
        setFabricante(d.fabricante); setModelo(d.modelo); setNumeroSerie(d.numeroSerie)
        setCapacidade(d.capacidade); setAgente(d.agente)
        setDataFabricacao(d.dataFabricacao); setUltimaRecarga(d.ultimaRecarga)
        setProximaRecarga(d.proximaRecarga); setUltimaInspecao(d.ultimaInspecao)
        setProximaInspecao(d.proximaInspecao)
      } finally { setLoading(false) }
    }
    fetch_()
  }, [id, session])

  // ── Validação por tab ──
  const tabValid: Record<TabKey, boolean> = {
    identificacao:  !!nome && !!tipo && !!local && !!regional,
    especificacoes: !!fabricante && !!numeroSerie,
    datas:          !!proximaInspecao,
  }
  const tabOrder: TabKey[] = ['identificacao', 'especificacoes', 'datas']
  const currentIdx    = tabOrder.indexOf(tab)
  const allValid      = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  const tipoCfg = TIPO_CONFIG[tipo] ?? null

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      setSuccessModal(true)
    } catch { alert('Erro ao salvar.') }
    finally { setIsSaving(false) }
  }

  // ── Estilos compartilhados ──
  const inputCls        = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls        = 'text-[13.5px] font-medium text-[#111827]'

  if (loading) return (
    <DashboardLayout title={isEdicao ? 'Editar Equipamento' : 'Novo Equipamento'}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title={isEdicao ? 'Editar Equipamento' : 'Novo Equipamento'}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in { animation: scaleIn 0.15s ease forwards; }
        .prog-bar { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── Breadcrumb ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => router.push('/equipamentos')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Equipamentos
            </button>
            {isEdicao && (
              <>
                <span className="text-[11px]">›</span>
                <button onClick={() => router.push(`/equipamentos/${id}`)} className="hover:text-[#3d6cf0] transition-colors font-medium">{id}</button>
              </>
            )}
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">{isEdicao ? 'Editar' : 'Novo'}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Etapa {currentIdx + 1} de {tabOrder.length}
          </span>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold'
                  : 'text-[#9ca3af] border-transparent hover:text-[#374151]'
              )}
            >
              {t.label}
              {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>

        {/* ── Conteúdo ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

          {/* ══ TAB IDENTIFICAÇÃO ══ */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4">

              {/* Seleção de Tipo — destaque visual */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Tipo de Equipamento *</div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIPO_OPTIONS.map(t => {
                    const cfg   = TIPO_CONFIG[t]
                    const Icon  = cfg.icon
                    const ativo = tipo === t
                    return (
                      <button
                        key={t}
                        onClick={() => setTipo(t)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold text-xs',
                          ativo
                            ? 'border-[#3d6cf0] bg-blue-50/50 text-[#3d6cf0]'
                            : 'border-slate-100 text-[#9ca3af] hover:border-slate-200'
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border"
                          style={ativo ? { background: cfg.bg, borderColor: cfg.border } : { background: '#f8fafc', borderColor: '#e3e8ef' }}
                        >
                          <Icon size={20} style={{ color: ativo ? cfg.color : '#c4cbd6' }} />
                        </div>
                        {t}
                        {ativo && <CheckCircle size={14} className="text-[#3d6cf0]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dados de identificação */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Dados do Equipamento</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nome / Descrição *</span>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} className={inputCls} placeholder="Ex: Extintor CO₂ – Bloco A" />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Status *</span>
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(opt.value)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                            status === opt.value
                              ? 'border-[#3d6cf0] bg-blue-50/50 text-[#3d6cf0]'
                              : 'border-slate-100 text-[#9ca3af] hover:border-slate-200'
                          )}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: opt.color }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Localização</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Local / Setor *</span>
                    <input type="text" value={local} onChange={e => setLocal(e.target.value)} className={inputCls} placeholder="Ex: Bloco A – Térreo" />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Regional *</span>
                    <input type="text" value={regional} onChange={e => setRegional(e.target.value)} className={inputCls} placeholder="Ex: Metropolitana" />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Observações</div>
                <div className="px-6 py-4">
                  <textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    rows={3}
                    className={cn(inputCls, 'h-auto py-2.5 resize-none leading-relaxed')}
                    placeholder="Notas adicionais sobre o equipamento..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB ESPECIFICAÇÕES ══ */}
          {tab === 'especificacoes' && (
            <div className="fade-up space-y-4">

              {/* Resumo do tipo selecionado */}
              {tipoCfg && (
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sectionTitleCls}>Tipo Selecionado</div>
                  <div className="px-6 py-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                      style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                    >
                      <tipoCfg.icon size={20} style={{ color: tipoCfg.color }} />
                    </div>
                    <div>
                      <p className="font-black text-[#111827] text-[14px]">{tipo}</p>
                      <button onClick={() => setTab('identificacao')} className="text-[11px] font-bold text-[#3d6cf0] hover:underline">Trocar tipo →</button>
                    </div>
                  </div>
                </div>
              )}

              {!tipo && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 font-medium">Selecione o tipo na etapa anterior para preencher as especificações.</p>
                </div>
              )}

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Fabricante & Modelo</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Fabricante *</span>
                    <input type="text" value={fabricante} onChange={e => setFabricante(e.target.value)} className={inputCls} placeholder="Ex: Amerex, Chubb, Viking..." />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Modelo</span>
                    <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} className={inputCls} placeholder="Ex: B260" />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nº de Série *</span>
                    <input type="text" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} className={inputCls} placeholder="Ex: AMX-2024-9921" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Capacidade & Agente</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Capacidade</span>
                    <input type="text" value={capacidade} onChange={e => setCapacidade(e.target.value)} className={inputCls} placeholder="Ex: 6 kg, 40 m, —" />
                  </div>
                  {(tipo === 'Extintor') && (
                    <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                      <span className={labelCls}>Agente Extintor</span>
                      <input type="text" value={agente} onChange={e => setAgente(e.target.value)} className={inputCls} placeholder="Ex: CO₂, Pó ABC, Água..." />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB DATAS ══ */}
          {tab === 'datas' && (
            <div className="fade-up space-y-4">

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Fabricação & Recarga</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Data de Fabricação</span>
                    <input type="date" value={dataFabricacao} onChange={e => setDataFabricacao(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Última Recarga</span>
                    <input type="date" value={ultimaRecarga} onChange={e => setUltimaRecarga(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Próxima Recarga</span>
                    <input type="date" value={proximaRecarga} onChange={e => setProximaRecarga(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Inspeções</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Última Inspeção</span>
                    <input type="date" value={ultimaInspecao} onChange={e => setUltimaInspecao(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Próxima Inspeção *</span>
                    <input type="date" value={proximaInspecao} onChange={e => setProximaInspecao(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
                  </div>
                </div>
              </div>

              {/* Aviso se data vencida */}
              {proximaInspecao && new Date(proximaInspecao + 'T00:00:00') < new Date() && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                    A data de próxima inspeção está no passado. Verifique se o equipamento está com status correto.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Barra inferior fixa ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">

          {/* Indicador de progresso */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {tabOrder.map(key => (
                <div
                  key={key}
                  className={cn('h-1.5 w-6 rounded-full transition-all', tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200')}
                />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Etapas: {completedCount}/{tabOrder.length}
            </span>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {currentIdx > 0 && (
              <button
                onClick={() => setTab(tabOrder[currentIdx - 1])}
                className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500"
              >
                VOLTAR
              </button>
            )}

            {currentIdx < tabOrder.length - 1 ? (
              <button
                onClick={() => setTab(tabOrder[currentIdx + 1])}
                className="flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white bg-[#3d6cf0] transition-all"
              >
                PRÓXIMO
              </button>
            ) : (
              <button
                disabled={!allValid || isSaving}
                onClick={handleSave}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                  allValid && !isSaving ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed'
                )}
              >
                {isSaving
                  ? <Loader2 className="animate-spin" size={16} />
                  : isEdicao ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR EQUIPAMENTO'
                }
              </button>
            )}
          </div>
        </div>

        {/* ── Modal Sucesso ── */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">
                {isEdicao ? 'Salvo!' : 'Cadastrado!'}
              </h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {isEdicao
                  ? 'As alterações foram salvas com sucesso.'
                  : 'O equipamento foi cadastrado com sucesso no sistema.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/equipamentos')}
                  className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs"
                >
                  VER LISTA
                </button>
                {isEdicao && (
                  <button
                    onClick={() => router.push(`/equipamentos/${id}`)}
                    className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs"
                  >
                    VER DETALHES
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}