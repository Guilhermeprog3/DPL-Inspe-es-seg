'use client'

import { useState, useRef } from 'react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  ShieldAlert, User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, X, Upload,
  Loader2, ClipboardList, Zap, ArrowLeft,
  CheckCircle2, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida =
  | 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO'
  | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | ''

const CLASSIFICACOES = [
  'Uso inadequado de EPI', 'Falta de EPI', 'Comportamento de risco',
  'Descumprimento de NR', 'Acidente de trabalho', 'Quase-acidente',
  'Uso indevido de equipamento', 'Ausência injustificada', 'Atraso recorrente',
  'Descumprimento de procedimento interno', 'Conduta inadequada com colegas',
  'Dano ao patrimônio', 'Falta de comunicação de incidente',
  'Violação de norma de segurança', 'Negligência em atividade crítica',
]

const GRAVIDADE_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  LEVE:       { color: '#10b981', bg: '#f0fdf9', border: '#a7f3d0', label: 'Leve' },
  MÉDIA:      { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Média' },
  GRAVE:      { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Grave' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', label: 'Gravíssima' },
}

const TIPO_MEDIDA_CFG: Record<string, { color: string }> = {
  'ADVERTÊNCIA VERBAL':  { color: '#f59e0b' },
  'ADVERTÊNCIA ESCRITA': { color: '#ef4444' },
  'SUSPENSÃO':           { color: '#7c3aed' },
  'CONVERSA PEDAGÓGICA': { color: '#0891b2' },
  'TREINAMENTO':         { color: '#10b981' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação',    icon: User },
  { key: 'classificacao', label: 'Classificação',    icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',        icon: AlertTriangle },
  { key: 'ocorrencia',    label: 'Ocorrência',       icon: FileText },
  { key: 'anexos',        label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

export default function NovaMedidaPage() {
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [successModal, setSuccessModal] = useState(false)

  // Step 1 — Identificação
  const [matriculaColab, setMatriculaColab] = useState('')
  const [statusColab, setStatusColab]       = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [matriculaSup, setMatriculaSup]     = useState('')
  const [statusSup, setStatusSup]           = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [dataMedida, setDataMedida]         = useState('')

  // Step 2 — Classificação
  const [tipoCategoria, setTipoCategoria]   = useState<TipoCategoria>('')
  const [tipoMedida, setTipoMedida]         = useState<TipoMedida>('')
  const [diasSuspensao, setDiasSuspensao]   = useState('')

  // Step 3 — Gravidade
  const [gravidade, setGravidade]           = useState<Gravidade>('')

  // Step 4 — Ocorrência
  const [classificacao, setClassificacao]   = useState('')
  const [ocorrencia, setOcorrencia]         = useState('')
  const [showDrop, setShowDrop]             = useState(false)

  // Step 5 — Anexos
  const [anexos, setAnexos]                 = useState<File[]>([])
  const fileRef                             = useRef<HTMLInputElement>(null)
  const [relacionarClick, setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao]   = useState('')

  const validar = (val: string, set: typeof setStatusColab) => {
    if (val.length < 4) { set('idle'); return }
    set('loading')
    setTimeout(() => set(val.toUpperCase().startsWith('M') ? 'valid' : 'invalid'), 700)
  }

  // Validação por tab
  const tabValid: Record<TabKey, boolean> = {
    identificacao: statusColab === 'valid' && statusSup === 'valid' && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade:     !!gravidade,
    ocorrencia:    !!classificacao && ocorrencia.trim().length >= 10,
    anexos:        !relacionarClick || !!numeroInspecao.trim(),
  }

  const tabOrder: TabKey[] = ['identificacao', 'classificacao', 'gravidade', 'ocorrencia', 'anexos']
  const currentIdx = tabOrder.indexOf(tab)

  const isTabLocked = (key: TabKey) => {
    const idx = tabOrder.indexOf(key)
    return tabOrder.slice(0, idx).some(k => !tabValid[k])
  }

  // Progresso
  const completedCount = tabOrder.filter(k => tabValid[k]).length
  const progressoPct = Math.round((completedCount / tabOrder.length) * 100)

  const allValid = tabOrder.every(k => tabValid[k])

  const reset = () => {
    setTab('identificacao')
    setMatriculaColab(''); setStatusColab('idle')
    setMatriculaSup(''); setStatusSup('idle'); setDataMedida('')
    setTipoCategoria(''); setTipoMedida(''); setDiasSuspensao('')
    setGravidade(''); setClassificacao(''); setOcorrencia('')
    setAnexos([]); setRelacionarClick(false); setNumeroInspecao('')
    setSuccessModal(false)
  }

  const inputCls = 'w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-3.5 px-4 text-sm font-semibold text-[#1a2535] outline-none focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/08 transition-all placeholder:font-normal placeholder:text-[#b0bac8]'
  const labelCls = 'text-[10px] font-black text-[#8896ab] uppercase tracking-[0.25em] mb-2 block'

  return (
    <MedidaLayout title="Nova Medida">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        .nm-root { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease forwards; }

        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .modal-in { animation: zoomIn 0.28s cubic-bezier(.22,.68,0,1.2) forwards; }

        .light-scroll::-webkit-scrollbar { width: 3px; }
        .light-scroll::-webkit-scrollbar-track { background: transparent; }
        .light-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        .prog-bar { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
        .drop-opt { transition: background 0.1s; }
        .drop-opt:hover { background: #f0f4f9; }
      `}</style>

      <div className="nm-root w-full flex flex-col bg-white min-h-[calc(100vh-60px)]">

        {/* ══ CABEÇALHO ══════════════════════════════════════════════════════ */}
        <div className="bg-white border-b border-[#e8edf3] px-6 pt-6 pb-0">

          {/* Botão voltar */}
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#8896ab] hover:text-[#094780] mb-5 group transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>

          {/* Título + ícone */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <span className="text-[9px] font-black text-[#094780] uppercase tracking-[0.35em]">
                SESMT · RH
              </span>
              <h1 className="text-[28px] font-black tracking-tighter text-[#0d1e33] uppercase leading-none mt-0.5"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Nova Medida
              </h1>
              <p className="text-[11px] text-[#8896ab] font-medium mt-1">
                Registro de medida disciplinar/administrativa
              </p>
            </div>
            <div className="bg-[#f0f4f9] p-2.5 rounded-xl border border-[#e2e8f0]">
              <ShieldAlert size={20} className="text-[#094780]" />
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[#8896ab] mb-1.5">
              <span>Progresso</span>
              <span>{completedCount}/{tabOrder.length} etapas · {progressoPct}%</span>
            </div>
            <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden">
              <div className="prog-bar h-full rounded-full"
                style={{
                  width: `${progressoPct}%`,
                  background: progressoPct === 100 ? '#10b981' : 'linear-gradient(90deg,#094780,#3b82f6)',
                }} />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              const isActive = tab === t.key
              const locked = isTabLocked(t.key)
              const done = tabValid[t.key]
              return (
                <button key={t.key}
                  onClick={() => !locked && setTab(t.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3.5 text-[12px] font-bold border-b-2 transition-all relative whitespace-nowrap',
                    isActive
                      ? 'text-[#094780] border-[#094780]'
                      : locked
                        ? 'text-[#c8d0dc] border-transparent cursor-not-allowed'
                        : done
                          ? 'text-[#10b981] border-transparent hover:border-[#e2e8f0]'
                          : 'text-[#8896ab] border-transparent hover:text-[#1a2535] hover:border-[#e2e8f0]',
                  )}>
                  <Icon size={14} />
                  {t.label}
                  {done && !isActive && (
                    <CheckCircle2 size={11} className="text-[#10b981]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ══ CONTEÚDO SCROLLÁVEL ════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto light-scroll bg-[#f8fafc] px-6 pt-6 pb-32">

          {/* TAB 1 — IDENTIFICAÇÃO */}
          {tab === 'identificacao' && (
            <div className="space-y-3 max-w-2xl mx-auto fade-up">
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm space-y-5">

                {/* Colaborador */}
                <div>
                  <label className={labelCls}>Colaborador (Matrícula) *</label>
                  <div className="relative">
                    <input type="text" value={matriculaColab} maxLength={10}
                      onChange={e => { setMatriculaColab(e.target.value); validar(e.target.value, setStatusColab) }}
                      placeholder="Ex: M001234"
                      className={cn(
                        'w-full rounded-2xl py-3.5 px-4 pr-11 text-sm font-semibold outline-none transition-all placeholder:font-normal placeholder:text-[#b0bac8]',
                        statusColab === 'valid'   && 'border border-emerald-300 bg-emerald-50/60 text-[#1a2535]',
                        statusColab === 'invalid' && 'border border-red-300 bg-red-50/60 text-[#1a2535]',
                        statusColab === 'idle'    && 'border border-[#e2e8f0] bg-[#f8fafc] text-[#1a2535] focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/06',
                        statusColab === 'loading' && 'border border-blue-200 bg-blue-50/40 text-[#1a2535]',
                      )} />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {statusColab === 'loading' && <Loader2 size={15} className="text-blue-500 animate-spin" />}
                      {statusColab === 'valid'   && <CheckCircle size={15} className="text-emerald-500" />}
                      {statusColab === 'invalid' && <X size={15} className="text-red-500" />}
                    </div>
                  </div>
                  {statusColab === 'invalid' && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">Matrícula não encontrada.</p>}
                  {statusColab === 'valid'   && <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1">Validada com sucesso ✓</p>}
                </div>

                {/* Supervisor */}
                <div>
                  <label className={labelCls}>Supervisor (Matrícula) *</label>
                  <div className="relative">
                    <input type="text" value={matriculaSup} maxLength={10}
                      onChange={e => { setMatriculaSup(e.target.value); validar(e.target.value, setStatusSup) }}
                      placeholder="Ex: M005678"
                      className={cn(
                        'w-full rounded-2xl py-3.5 px-4 pr-11 text-sm font-semibold outline-none transition-all placeholder:font-normal placeholder:text-[#b0bac8]',
                        statusSup === 'valid'   && 'border border-emerald-300 bg-emerald-50/60 text-[#1a2535]',
                        statusSup === 'invalid' && 'border border-red-300 bg-red-50/60 text-[#1a2535]',
                        statusSup === 'idle'    && 'border border-[#e2e8f0] bg-[#f8fafc] text-[#1a2535] focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/06',
                        statusSup === 'loading' && 'border border-blue-200 bg-blue-50/40 text-[#1a2535]',
                      )} />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {statusSup === 'loading' && <Loader2 size={15} className="text-blue-500 animate-spin" />}
                      {statusSup === 'valid'   && <CheckCircle size={15} className="text-emerald-500" />}
                      {statusSup === 'invalid' && <X size={15} className="text-red-500" />}
                    </div>
                  </div>
                  {statusSup === 'invalid' && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">Matrícula não encontrada.</p>}
                  {statusSup === 'valid'   && <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1">Validada com sucesso ✓</p>}
                </div>

                {/* Data */}
                <div>
                  <label className={labelCls}>Data da Medida *</label>
                  <input type="date" value={dataMedida}
                    onChange={e => setDataMedida(e.target.value)}
                    className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 — CLASSIFICAÇÃO */}
          {tab === 'classificacao' && (
            <div className="space-y-2.5 max-w-2xl mx-auto fade-up">

              {/* Tipo de categoria */}
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm">
                <label className={labelCls}>Tipo *</label>
                <div className="flex gap-2.5 flex-wrap">
                  {(['SEGURANÇA', 'ADMINISTRATIVA'] as const).map(opt => (
                    <button key={opt} type="button" onClick={() => setTipoCategoria(opt)}
                      className={cn(
                        'px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide border-2 transition-all',
                        tipoCategoria === opt
                          ? 'bg-[#094780] text-white border-[#094780] shadow-md shadow-[#094780]/20'
                          : 'bg-white border-[#e2e8f0] text-[#8896ab] hover:border-[#cbd5e1] hover:text-[#475569]',
                      )}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de medida — cards igual aos itens do checklist */}
              {(['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'] as TipoMedida[]).map((opt, idx) => {
                const cfg = TIPO_MEDIDA_CFG[opt]
                const isActive = tipoMedida === opt
                return (
                  <div key={opt}
                    onClick={() => { setTipoMedida(opt); if (opt !== 'SUSPENSÃO') setDiasSuspensao('') }}
                    className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-4 flex items-center justify-between gap-4 shadow-sm hover:border-[#094780]/15 transition-all cursor-pointer"
                    style={{ animationDelay: `${idx * 0.03}s` }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-black text-[#b0bac8] w-5 flex-shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <p className="text-[13px] font-semibold text-[#1a2535] leading-snug">{opt}</p>
                    </div>
                    <button
                      className={cn(
                        'w-10 h-10 rounded-xl font-black text-[10px] border-2 flex items-center justify-center transition-all flex-shrink-0',
                        isActive
                          ? 'text-white shadow-md'
                          : 'bg-white border-[#e2e8f0] text-[#b0bac8]',
                      )}
                      style={isActive ? { backgroundColor: cfg?.color, borderColor: cfg?.color, boxShadow: `0 4px 12px ${cfg?.color}35` } : {}}>
                      <CheckCircle2 size={15} />
                    </button>
                  </div>
                )
              })}

              {/* Dias de suspensão */}
              {tipoMedida === 'SUSPENSÃO' && (
                <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm fade-up">
                  <label className={labelCls}>Dias de Suspensão *</label>
                  <input type="number" min={1} max={30} value={diasSuspensao}
                    onChange={e => setDiasSuspensao(e.target.value)} placeholder="Ex: 3"
                    className={cn(inputCls, 'w-36')} />
                </div>
              )}

              {/* Legenda */}
              <div className="flex items-center gap-4 pt-2 px-1">
                {Object.entries(TIPO_MEDIDA_CFG).map(([label, { color }]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[10px] text-[#8896ab] font-medium">{label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3 — GRAVIDADE */}
          {tab === 'gravidade' && (
            <div className="space-y-2.5 max-w-2xl mx-auto fade-up">
              {(Object.entries(GRAVIDADE_CFG) as [Gravidade, typeof GRAVIDADE_CFG[string]][]).map(([key, cfg], idx) => {
                const isActive = gravidade === key
                return (
                  <div key={key}
                    onClick={() => setGravidade(key)}
                    className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-4 flex items-center justify-between gap-4 shadow-sm hover:border-[#094780]/15 transition-all cursor-pointer"
                    style={{ animationDelay: `${idx * 0.03}s`, ...(isActive ? { borderColor: cfg.border, backgroundColor: cfg.bg } : {}) }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-black text-[#b0bac8] w-5 flex-shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                        <p className="text-[13px] font-semibold leading-snug"
                          style={{ color: isActive ? cfg.color : '#1a2535' }}>
                          {cfg.label}
                        </p>
                      </div>
                    </div>
                    <button
                      className={cn(
                        'w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0',
                        isActive ? 'text-white shadow-md' : 'bg-white border-[#e2e8f0] text-[#b0bac8]',
                      )}
                      style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color, boxShadow: `0 4px 12px ${cfg.color}35` } : {}}>
                      <CheckCircle2 size={15} />
                    </button>
                  </div>
                )
              })}

              {/* Legenda */}
              <div className="flex items-center gap-4 pt-2 px-1">
                {Object.entries(GRAVIDADE_CFG).map(([, cfg]) => (
                  <div key={cfg.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <span className="text-[10px] text-[#8896ab] font-medium">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4 — OCORRÊNCIA */}
          {tab === 'ocorrencia' && (
            <div className="space-y-3 max-w-2xl mx-auto fade-up">
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm space-y-5">

                {/* Dropdown classificação */}
                <div>
                  <label className={labelCls}>Classificação da Ocorrência *</label>
                  <div className="relative">
                    <button type="button" onClick={() => setShowDrop(p => !p)}
                      className={cn(
                        'w-full text-left rounded-2xl py-3.5 px-4 text-sm font-semibold flex items-center justify-between transition-all bg-[#f8fafc] border',
                        showDrop ? 'border-[#094780]/35 ring-2 ring-[#094780]/06' : 'border-[#e2e8f0]',
                        classificacao ? 'text-[#1a2535]' : 'text-[#b0bac8] font-normal',
                      )}>
                      {classificacao || 'Selecione uma classificação...'}
                      <ChevronDown size={15} className={cn('text-[#8896ab] transition-transform', showDrop && 'rotate-180')} />
                    </button>
                    {showDrop && (
                      <div className="absolute z-30 w-full mt-2 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden">
                        <div className="max-h-56 overflow-y-auto light-scroll">
                          {CLASSIFICACOES.map(c => (
                            <button key={c} type="button"
                              onClick={() => { setClassificacao(c); setShowDrop(false) }}
                              className={cn(
                                'drop-opt w-full text-left px-4 py-3 text-sm border-b border-[#f0f2f5] last:border-0',
                                classificacao === c ? 'text-[#094780] font-bold bg-[#094780]/4' : 'text-[#4a5568] font-medium',
                              )}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <label className={labelCls}>Descrição Detalhada *</label>
                  <textarea value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} rows={6}
                    placeholder="Descreva o ocorrido, contexto, consequências e informações relevantes..."
                    className={cn(inputCls, 'resize-none leading-relaxed')} />
                  <div className="flex justify-end mt-1">
                    <span className={cn('text-[10px] font-bold',
                      ocorrencia.length < 10 ? 'text-red-400' : 'text-[#b0bac8]')}>
                      {ocorrencia.length} caracteres {ocorrencia.length < 10 && '(mín. 10)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5 — ANEXOS & VÍNCULO */}
          {tab === 'anexos' && (
            <div className="space-y-3 max-w-2xl mx-auto fade-up">

              {/* Upload */}
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm">
                <label className={labelCls}>Documentos Anexos</label>
                <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
                  onChange={e => setAnexos(prev => [...prev, ...Array.from(e.target.files || [])])} />

                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#e2e8f0] rounded-2xl p-6 flex flex-col items-center gap-2.5 hover:border-[#094780]/30 hover:bg-[#094780]/[0.02] transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-[#f0f4f9] flex items-center justify-center group-hover:bg-[#094780]/08 group-hover:scale-105 transition-all">
                    <Upload size={18} className="text-[#8896ab] group-hover:text-[#094780] transition-colors" />
                  </div>
                  <p className="text-[12px] font-black text-[#8896ab] group-hover:text-[#094780] uppercase tracking-wide transition-colors">
                    Upload de Imagem ou PDF
                  </p>
                  <p className="text-[10px] text-[#b0bac8] font-medium">PNG, JPG, PDF · múltiplos arquivos</p>
                </button>

                {anexos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {anexos.map((file, i) => (
                      <div key={i}
                        className="bg-white rounded-[20px] border border-[#e8edf3] px-4 py-3.5 flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#094780]/08 flex items-center justify-center flex-shrink-0">
                            <Paperclip size={14} className="text-[#094780]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-[#1a2535] truncate">{file.name}</p>
                            <p className="text-[10px] text-[#8896ab]">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button type="button"
                          onClick={() => setAnexos(p => p.filter((_, j) => j !== i))}
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0">
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Relacionar com CLICK */}
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f0f4f9] rounded-xl flex items-center justify-center">
                      <Link2 size={16} className="text-[#094780]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1a2535]">Relacionar com o CLICK?</p>
                      <p className="text-[10px] text-[#8896ab] font-medium mt-0.5">Vincule a uma inspeção existente</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setRelacionarClick(p => !p)}
                    className={cn('w-12 h-6 rounded-full relative flex-shrink-0 transition-all',
                      relacionarClick ? 'bg-[#094780]' : 'bg-[#e2e8f0]')}>
                    <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                      relacionarClick ? 'left-7' : 'left-1')} />
                  </button>
                </div>

                {relacionarClick && (
                  <div className="mt-5 pt-5 border-t border-[#e8edf3] fade-up">
                    <label className={labelCls}>Número da Inspeção (CLICK) *</label>
                    <div className="relative">
                      <ClipboardList size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8896ab] pointer-events-none" />
                      <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)}
                        placeholder="Ex: INSP-2025-0042" className={cn(inputCls, 'pl-10')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ══ BARRA INFERIOR FIXA ════════════════════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#e8edf3] px-6 py-4">
          <button
            disabled={currentIdx < tabOrder.length - 1 ? !tabValid[tab] : !allValid}
            onClick={() => {
              if (currentIdx < tabOrder.length - 1) {
                if (tabValid[tab]) setTab(tabOrder[currentIdx + 1])
              } else {
                if (allValid) setSuccessModal(true)
              }
            }}
            className={cn(
              'w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all text-[12px] uppercase tracking-wide',
              (currentIdx < tabOrder.length - 1 ? tabValid[tab] : allValid)
                ? 'bg-[#094780] shadow-lg shadow-[#094780]/20 hover:bg-[#0a5494]'
                : 'bg-[#d1d9e6] text-[#8896ab] cursor-not-allowed',
            )}>
            <Zap size={16} fill="currentColor" />
            {currentIdx < tabOrder.length - 1 ? 'Próximo' : 'Registrar Medida'}
          </button>
        </div>

        {/* ══ MODAL SUCESSO ══════════════════════════════════════════════════ */}
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0d1e33]/80 backdrop-blur-md">
            <div className="modal-in bg-white rounded-[36px] w-full max-w-xs p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#0d1e33] mb-1 uppercase italic"
                style={{ fontFamily: "'Syne', sans-serif" }}>Registrado!</h3>
              <p className="text-[10px] text-[#8896ab] font-bold mb-6 uppercase tracking-[0.25em]">
                Medida administrativa salva com sucesso.
              </p>

              {tipoMedida && (
                <div className="mb-2 px-4 py-2.5 rounded-xl bg-[#f8fafc] border border-[#e8edf3] flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: TIPO_MEDIDA_CFG[tipoMedida]?.color }} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#4a5568]">{tipoMedida}</span>
                </div>
              )}
              {gravidade && (
                <div className="mb-6 mt-2 px-4 py-2.5 rounded-xl flex items-center gap-2 justify-center"
                  style={{ backgroundColor: GRAVIDADE_CFG[gravidade]?.bg, border: `1px solid ${GRAVIDADE_CFG[gravidade]?.border}` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GRAVIDADE_CFG[gravidade]?.color }} />
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: GRAVIDADE_CFG[gravidade]?.color }}>
                    {GRAVIDADE_CFG[gravidade]?.label}
                  </span>
                </div>
              )}

              <button
                className="w-full py-4 bg-[#094780] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0a5494] transition-all"
                onClick={reset}>
                Novo Registro →
              </button>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}