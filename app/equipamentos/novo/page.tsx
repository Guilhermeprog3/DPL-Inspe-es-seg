'use client'

// Rota: app/equipamentos/novo/page.tsx
// Formulário de cadastro de equipamento em 3 etapas.
// Para edição, use: app/equipamentos/editar/[id]/page.tsx
// (ambos compartilham a mesma estrutura visual)

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
  Package, Wrench, FileText,
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'identificacao'  as const, label: 'Identificação',  icon: Package  },
  { key: 'especificacoes' as const, label: 'Especificações', icon: Wrench   },
  { key: 'datas'          as const, label: 'Datas',          icon: FileText },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovoEquipamentoPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [isSaving, setIsSaving]     = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [novoId, setNovoId]         = useState('')
  const [tab, setTab]               = useState<TabKey>('identificacao')

  // ── Etapa 1 — Identificação ──
  const [tipo, setTipo]           = useState('')
  const [nome, setNome]           = useState('')
  const [status, setStatus]       = useState<StatusEquip>('ativo')
  const [local, setLocal]         = useState('')
  const [regional, setRegional]   = useState('')
  const [observacoes, setObs]     = useState('')

  // ── Etapa 2 — Especificações ──
  const [fabricante, setFabricante]     = useState('')
  const [modelo, setModelo]             = useState('')
  const [numeroSerie, setNumeroSerie]   = useState('')
  const [capacidade, setCapacidade]     = useState('')
  const [agente, setAgente]             = useState('')

  // ── Etapa 3 — Datas ──
  const [dataFabricacao, setDataFab]    = useState('')
  const [ultimaRecarga, setUltRec]      = useState('')
  const [proximaRecarga, setProxRec]    = useState('')
  const [ultimaInspecao, setUltInsp]    = useState('')
  const [proximaInspecao, setProxInsp]  = useState('')

  // ── Validação ──
  const tabValid: Record<TabKey, boolean> = {
    identificacao:  !!tipo && !!nome && !!local && !!regional,
    especificacoes: !!fabricante && !!numeroSerie,
    datas:          !!proximaInspecao,
  }
  const tabOrder: TabKey[]  = ['identificacao', 'especificacoes', 'datas']
  const currentIdx          = tabOrder.indexOf(tab)
  const allValid            = tabOrder.every(k => tabValid[k])
  const completedCount      = tabOrder.filter(k => tabValid[k]).length
  const tipoCfg             = TIPO_CONFIG[tipo] ?? null

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const payload = {
        nome, tipo, local, regional, status, observacoes,
        fabricante, modelo, numeroSerie, capacidade, agente,
        dataFabricacao, ultimaRecarga, proximaRecarga,
        ultimaInspecao, proximaInspecao,
      }
      // Substituir pela chamada real:
      // const res = await fetch('http://localhost:3001/equipamentos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(payload),
      // })
      // const data = await res.json()
      // setNovoId(data.id)
      await new Promise(r => setTimeout(r, 800))
      setNovoId('EQ-' + Math.floor(Math.random() * 9000 + 1000))
      setSuccessModal(true)
    } catch { alert('Erro ao cadastrar. Tente novamente.') }
    finally { setIsSaving(false) }
  }

  // ── Estilos compartilhados ──
  const inputCls        = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls        = 'text-[13.5px] font-medium text-[#111827]'

  return (
    <DashboardLayout title="Novo Equipamento">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up   { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in  { animation: scaleIn 0.15s ease forwards; }
        .prog-bar  { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
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
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Novo Equipamento</span>
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

          {/* ══ ETAPA 1 — IDENTIFICAÇÃO ══ */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4">

              {/* Seleção de tipo com cards visuais */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Tipo de Equipamento *</div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIPO_OPTIONS.map(t => {
                    const cfg  = TIPO_CONFIG[t]
                    const Icon = cfg.icon
                    const sel  = tipo === t
                    return (
                      <button
                        key={t}
                        onClick={() => setTipo(t)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          sel
                            ? 'border-[#3d6cf0] bg-blue-50/50'
                            : 'border-slate-100 hover:border-slate-200'
                        )}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all"
                          style={sel
                            ? { background: cfg.bg, borderColor: cfg.border }
                            : { background: '#f8fafc', borderColor: '#e3e8ef' }
                          }
                        >
                          <Icon size={22} style={{ color: sel ? cfg.color : '#c4cbd6' }} />
                        </div>
                        <span className={cn('text-xs font-bold', sel ? 'text-[#3d6cf0]' : 'text-[#9ca3af]')}>{t}</span>
                        {sel && <CheckCircle size={13} className="text-[#3d6cf0]" />}
                      </button>
                    )
                  })}
                </div>
                {!tipo && (
                  <div className="mx-4 mb-4 flex items-center gap-2 p-3 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg">
                    <AlertCircle size={13} className="text-[#c4cbd6] flex-shrink-0" />
                    <p className="text-[12px] text-[#9ca3af]">Selecione o tipo para continuar</p>
                  </div>
                )}
              </div>

              {/* Nome, status */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Dados do Equipamento</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nome / Descrição *</span>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Extintor CO₂ – Bloco A"
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Status *</span>
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(opt.value)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5',
                            status === opt.value
                              ? 'border-[#3d6cf0] bg-blue-50/50 text-[#3d6cf0]'
                              : 'border-slate-100 text-[#9ca3af] hover:border-slate-200'
                          )}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
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
                    <input
                      type="text"
                      value={local}
                      onChange={e => setLocal(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Bloco A – Térreo"
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Regional *</span>
                    <input
                      type="text"
                      value={regional}
                      onChange={e => setRegional(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Metropolitana"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Observações</div>
                <div className="px-6 py-4">
                  <textarea
                    value={observacoes}
                    onChange={e => setObs(e.target.value)}
                    rows={3}
                    className={cn(inputCls, 'h-auto py-2.5 resize-none leading-relaxed')}
                    placeholder="Notas adicionais sobre localização, acesso ou particularidades do equipamento..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ ETAPA 2 — ESPECIFICAÇÕES ══ */}
          {tab === 'especificacoes' && (
            <div className="fade-up space-y-4">

              {/* Resumo do tipo selecionado */}
              {tipoCfg ? (
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sectionTitleCls}>Tipo Selecionado</div>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                        style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                      >
                        <tipoCfg.icon size={20} style={{ color: tipoCfg.color }} />
                      </div>
                      <div>
                        <p className="font-black text-[#111827] text-[14px]">{tipo}</p>
                        <p className="text-[11px] text-[#9ca3af] mt-0.5">{nome || 'Sem nome definido'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTab('identificacao')}
                      className="text-[11px] font-bold text-[#3d6cf0] hover:underline flex-shrink-0"
                    >
                      Alterar →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 font-medium">
                    Volte à etapa anterior e selecione o tipo do equipamento.
                  </p>
                </div>
              )}

              {/* Fabricante & modelo */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Fabricante & Modelo</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Fabricante *</span>
                    <input
                      type="text"
                      value={fabricante}
                      onChange={e => setFabricante(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Amerex, Chubb, Viking, Siemens..."
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Modelo</span>
                    <input
                      type="text"
                      value={modelo}
                      onChange={e => setModelo(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: B260, HID-12..."
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nº de Série *</span>
                    <input
                      type="text"
                      value={numeroSerie}
                      onChange={e => setNumeroSerie(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: AMX-2024-9921"
                    />
                  </div>
                </div>
              </div>

              {/* Capacidade e agente */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Capacidade & Agente</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Capacidade</span>
                    <input
                      type="text"
                      value={capacidade}
                      onChange={e => setCapacidade(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: 6 kg, 40 m, —"
                    />
                  </div>
                  {tipo === 'Extintor' && (
                    <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                      <span className={labelCls}>Agente Extintor</span>
                      <input
                        type="text"
                        value={agente}
                        onChange={e => setAgente(e.target.value)}
                        className={inputCls}
                        placeholder="Ex: CO₂, Pó ABC, Água pressurizada..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ ETAPA 3 — DATAS ══ */}
          {tab === 'datas' && (
            <div className="fade-up space-y-4">

              {/* Resumo rápido das etapas anteriores */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Resumo</div>
                <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1">Equipamento</p>
                    <p className="text-[13px] font-semibold text-[#111827] truncate">{nome || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1">Tipo</p>
                    {tipo && tipoCfg ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                        style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}
                      >
                        <tipoCfg.icon size={9} />{tipo}
                      </span>
                    ) : <p className="text-[13px] text-[#9ca3af]">—</p>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1">Nº de Série</p>
                    <p className="text-[12px] font-mono text-[#374151]">{numeroSerie || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Fabricação & recarga */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Fabricação & Recarga</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Data de Fabricação</span>
                    <input
                      type="date"
                      value={dataFabricacao}
                      onChange={e => setDataFab(e.target.value)}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Última Recarga</span>
                    <input
                      type="date"
                      value={ultimaRecarga}
                      onChange={e => setUltRec(e.target.value)}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Próxima Recarga</span>
                    <input
                      type="date"
                      value={proximaRecarga}
                      onChange={e => setProxRec(e.target.value)}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                </div>
              </div>

              {/* Inspeções */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Inspeções</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Última Inspeção</span>
                    <input
                      type="date"
                      value={ultimaInspecao}
                      onChange={e => setUltInsp(e.target.value)}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Próxima Inspeção *</span>
                    <input
                      type="date"
                      value={proximaInspecao}
                      onChange={e => setProxInsp(e.target.value)}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                </div>
              </div>

              {/* Aviso se data passada */}
              {proximaInspecao && new Date(proximaInspecao + 'T00:00:00') < new Date() && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                    A data de próxima inspeção está no passado. Verifique se o status está correto.
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
                  : 'CADASTRAR EQUIPAMENTO'
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
              <h3 className="font-black text-xl text-slate-800 mb-1">Cadastrado!</h3>
              {novoId && (
                <p className="text-[#3d6cf0] font-black text-xs mb-2 uppercase tracking-widest">{novoId}</p>
              )}
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                O equipamento foi cadastrado com sucesso no sistema.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/equipamentos')}
                  className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
                >
                  VER LISTA
                </button>
                <button
                  onClick={() => {
                    // Resetar o formulário para cadastrar outro
                    setTipo(''); setNome(''); setStatus('ativo'); setLocal(''); setRegional(''); setObs('')
                    setFabricante(''); setModelo(''); setNumeroSerie(''); setCapacidade(''); setAgente('')
                    setDataFab(''); setUltRec(''); setProxRec(''); setUltInsp(''); setProxInsp('')
                    setSuccessModal(false)
                    setTab('identificacao')
                  }}
                  className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs hover:bg-[#3460d8] transition-all"
                >
                  NOVO CADASTRO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}