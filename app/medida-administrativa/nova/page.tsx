'use client'

import { useState, useRef } from 'react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  ShieldAlert, User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, ChevronDown, X, Upload,
  Loader2, ClipboardList, ChevronRight, ChevronLeft,
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

const STEPS = [
  { id: 1, label: 'Identificação',    icon: User },
  { id: 2, label: 'Classificação',    icon: Tag },
  { id: 3, label: 'Gravidade',        icon: AlertTriangle },
  { id: 4, label: 'Ocorrência',       icon: FileText },
  { id: 5, label: 'Anexos & Vínculo', icon: Paperclip },
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

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function MatriculaInput({ label, value, onChange, status, placeholder }: {
  label: string; value: string
  onChange: (v: string) => void
  status: 'idle' | 'loading' | 'valid' | 'invalid'
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#8896ab]">{label}</label>
      <div className="relative">
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} maxLength={10}
          className={cn(
            'w-full rounded-2xl py-3.5 px-4 pr-11 text-sm font-semibold outline-none transition-all',
            'placeholder:font-normal placeholder:text-[#b0bac8]',
            status === 'valid'   && 'border border-emerald-300 bg-emerald-50/60 text-[#1a2535] focus:border-emerald-400',
            status === 'invalid' && 'border border-red-300 bg-red-50/60 text-[#1a2535] focus:border-red-400',
            status === 'idle'    && 'border border-[#e2e8f0] bg-[#f8fafc] text-[#1a2535] focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/06',
            status === 'loading' && 'border border-blue-200 bg-blue-50/40 text-[#1a2535]',
          )}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {status === 'loading' && <Loader2 size={15} className="text-blue-500 animate-spin" />}
          {status === 'valid'   && <CheckCircle size={15} className="text-emerald-500" />}
          {status === 'invalid' && <X size={15} className="text-red-500" />}
        </div>
      </div>
      {status === 'invalid' && <p className="text-[10px] text-red-500 font-bold ml-1">Matrícula não encontrada.</p>}
      {status === 'valid'   && <p className="text-[10px] text-emerald-600 font-bold ml-1">Validada com sucesso ✓</p>}
    </div>
  )
}

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-4 h-px bg-[#094780]/30" />
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#094780]/60">Passo {step} de 5</span>
      </div>
      <h2 className="text-[24px] font-black text-[#0d1e33] leading-tight mb-2"
        style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h2>
      <p className="text-[13px] text-[#8896ab] leading-relaxed max-w-md">{subtitle}</p>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#8896ab] mb-2.5">
      {children}
    </label>
  )
}

const inputCls = 'w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-3.5 px-4 text-sm font-semibold text-[#1a2535] outline-none focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/06 transition-all placeholder:font-normal placeholder:text-[#b0bac8]'

// ─── Página ───────────────────────────────────────────────────────────────────
export default function NovaMedidaPage() {
  const [step, setStep] = useState(1)

  const [matriculaColab, setMatriculaColab] = useState('')
  const [statusColab, setStatusColab]       = useState<'idle'|'loading'|'valid'|'invalid'>('idle')
  const [matriculaSup, setMatriculaSup]     = useState('')
  const [statusSup, setStatusSup]           = useState<'idle'|'loading'|'valid'|'invalid'>('idle')
  const [dataMedida, setDataMedida]         = useState('')

  const [tipoCategoria, setTipoCategoria]   = useState<TipoCategoria>('')
  const [tipoMedida, setTipoMedida]         = useState<TipoMedida>('')
  const [diasSuspensao, setDiasSuspensao]   = useState('')

  const [gravidade, setGravidade]           = useState<Gravidade>('')

  const [classificacao, setClassificacao]   = useState('')
  const [ocorrencia, setOcorrencia]         = useState('')
  const [showDrop, setShowDrop]             = useState(false)

  const [anexos, setAnexos]                 = useState<File[]>([])
  const fileRef                             = useRef<HTMLInputElement>(null)
  const [relacionarClick, setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao]   = useState('')
  const [successModal, setSuccessModal]       = useState(false)

  const validar = (val: string, set: typeof setStatusColab) => {
    if (val.length < 4) { set('idle'); return }
    set('loading')
    setTimeout(() => set(val.toUpperCase().startsWith('M') ? 'valid' : 'invalid'), 700)
  }

  const stepValid = [
    statusColab === 'valid' && statusSup === 'valid' && !!dataMedida,
    !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    !!gravidade,
    !!classificacao && ocorrencia.trim().length >= 10,
    !relacionarClick || !!numeroInspecao.trim(),
  ]
  const allValid = stepValid.every(Boolean)
  const progressoPct = Math.round(((step - 1) / STEPS.length) * 100)

  const reset = () => {
    setStep(1); setMatriculaColab(''); setStatusColab('idle')
    setMatriculaSup(''); setStatusSup('idle'); setDataMedida('')
    setTipoCategoria(''); setTipoMedida(''); setDiasSuspensao('')
    setGravidade(''); setClassificacao(''); setOcorrencia('')
    setAnexos([]); setRelacionarClick(false); setNumeroInspecao(''); setSuccessModal(false)
  }

  return (
    <MedidaLayout title="Nova Medida" breadcrumb="SIGS / Medida Administrativa / Nova">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        .nm-root { font-family: 'DM Sans', sans-serif; }

        .light-scroll::-webkit-scrollbar { width: 3px; }
        .light-scroll::-webkit-scrollbar-track { background: transparent; }
        .light-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .step-panel { animation: fadeSlide 0.25s ease forwards; }

        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
        .modal-in { animation: zoomIn 0.28s cubic-bezier(.22,.68,0,1.2) forwards; }

        .prog-bar { transition: width 0.4s cubic-bezier(.4,0,.2,1); }
        .drop-opt { transition: background 0.1s; }
        .drop-opt:hover { background: #f0f4f9; }
      `}</style>

      <div className="nm-root flex h-[calc(100vh-60px)] overflow-hidden bg-white">

        {/* ══ PAINEL ESQUERDO ═══════════════════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-[272px] xl:w-[308px] flex-shrink-0 bg-white border-r border-[#e8edf3] relative overflow-hidden">

          {/* Ornamentos subtis */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(9,71,128,0.04) 0%,transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(230,122,14,0.04) 0%,transparent 70%)' }} />
          </div>

          {/* Header painel */}
          <div className="relative px-6 pt-7 pb-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#094780,#1a6ab5)', boxShadow: '0 4px 12px rgba(9,71,128,0.22)' }}>
                <ShieldAlert size={14} className="text-white" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8896ab]">SESMT · RH</p>
            </div>

            <h1 className="text-[22px] xl:text-[26px] font-black text-[#0d1e33] leading-tight tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Nova<br /><span className="text-[#094780]">Medida</span>
            </h1>
            <p className="text-[11px] text-[#8896ab] leading-relaxed">
              Preencha os dados para registrar formalmente a medida disciplinar.
            </p>
          </div>

          {/* Progresso */}
          <div className="px-6 mb-5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[#b0bac8] mb-1.5">
              <span>Progresso</span><span>{progressoPct}%</span>
            </div>
            <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden">
              <div className="prog-bar h-full rounded-full"
                style={{
                  width: `${progressoPct}%`,
                  background: progressoPct === 100 ? '#10b981' : 'linear-gradient(90deg,#094780,#3b82f6)',
                }} />
            </div>
          </div>

          {/* Steps nav */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto light-scroll pb-4">
            {STEPS.map(s => {
              const done = step > s.id, active = step === s.id, locked = step < s.id
              const Icon = s.icon
              return (
                <button key={s.id} type="button" disabled={locked}
                  onClick={() => !locked && setStep(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-left border',
                    active  && 'bg-[#094780]/[0.06] border-[#094780]/12',
                    !active && 'border-transparent',
                    done    && 'hover:bg-[#f8fafc] cursor-pointer',
                    locked  && 'opacity-35 cursor-not-allowed',
                    !active && !locked && 'hover:bg-[#f8fafc]',
                  )}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={
                      active ? { background: '#094780', boxShadow: '0 4px 10px rgba(9,71,128,0.22)' }
                    : done   ? { background: 'rgba(16,185,129,0.12)' }
                    : { background: '#f0f4f9' }
                    }>
                    {done
                      ? <CheckCircle size={13} className="text-emerald-500" />
                      : <Icon size={13} style={{ color: active ? '#fff' : '#8896ab' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[12px] font-bold truncate',
                      active ? 'text-[#094780]' : done ? 'text-[#4a5568]' : 'text-[#8896ab]')}>
                      {s.label}
                    </p>
                    {done   && <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Concluído</p>}
                    {active && <p className="text-[9px] font-black uppercase tracking-widest text-[#094780]/60">Em andamento</p>}
                  </div>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-[#094780] animate-pulse flex-shrink-0" />}
                </button>
              )
            })}
          </nav>

          {/* Resumo dinâmico */}
          {(tipoMedida || gravidade) && (
            <div className="mx-4 mb-4 p-4 rounded-2xl bg-[#f8fafc] border border-[#e8edf3]">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#b0bac8] mb-3">Resumo</p>
              {tipoMedida && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: TIPO_MEDIDA_CFG[tipoMedida]?.color || '#094780' }} />
                  <span className="text-[11px] font-semibold text-[#4a5568] truncate">{tipoMedida}</span>
                </div>
              )}
              {gravidade && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: GRAVIDADE_CFG[gravidade]?.color }} />
                  <span className="text-[11px] font-bold" style={{ color: GRAVIDADE_CFG[gravidade]?.color }}>
                    {GRAVIDADE_CFG[gravidade]?.label}
                  </span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ══ PAINEL DIREITO ════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">

          {/* Progress mobile */}
          <div className="lg:hidden h-1 bg-[#f0f4f9]">
            <div className="prog-bar h-full rounded-full"
              style={{ width: `${progressoPct}%`, background: 'linear-gradient(90deg,#094780,#3b82f6)' }} />
          </div>

          {/* Scroll area */}
          <div className="flex-1 overflow-y-auto light-scroll bg-[#f8fafc] px-8 sm:px-14 xl:px-20 py-10">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="step-panel max-w-xl mx-auto">
                <StepHeader step={1} title="Identificação"
                  subtitle="Informe as matrículas do colaborador e do supervisor, e a data da medida." />
                <div className="bg-white rounded-[22px] border border-[#e8edf3] p-6 shadow-sm space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <MatriculaInput label="Colaborador (Matrícula) *" value={matriculaColab}
                      onChange={v => { setMatriculaColab(v); validar(v, setStatusColab) }}
                      status={statusColab} placeholder="Ex: M001234" />
                    <MatriculaInput label="Supervisor (Matrícula) *" value={matriculaSup}
                      onChange={v => { setMatriculaSup(v); validar(v, setStatusSup) }}
                      status={statusSup} placeholder="Ex: M005678" />
                  </div>
                  <div>
                    <FieldLabel>Data da Medida *</FieldLabel>
                    <input type="date" value={dataMedida} onChange={e => setDataMedida(e.target.value)}
                      className={cn(inputCls, 'sm:w-56')} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="step-panel max-w-xl mx-auto space-y-4">
                <StepHeader step={2} title="Classificação da Medida"
                  subtitle="Selecione o tipo e a medida disciplinar a ser aplicada." />

                <div className="bg-white rounded-[22px] border border-[#e8edf3] p-6 shadow-sm">
                  <FieldLabel>Tipo *</FieldLabel>
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

                <div className="bg-white rounded-[22px] border border-[#e8edf3] p-6 shadow-sm">
                  <FieldLabel>Tipo de Medida *</FieldLabel>
                  <div className="flex gap-2 flex-wrap">
                    {(['ADVERTÊNCIA VERBAL','ADVERTÊNCIA ESCRITA','SUSPENSÃO','CONVERSA PEDAGÓGICA','TREINAMENTO'] as TipoMedida[]).map(opt => {
                      const cfg = TIPO_MEDIDA_CFG[opt]
                      const active = tipoMedida === opt
                      return (
                        <button key={opt} type="button"
                          onClick={() => { setTipoMedida(opt); if (opt !== 'SUSPENSÃO') setDiasSuspensao('') }}
                          className={cn(
                            'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide border-2 transition-all',
                            active ? 'text-white border-transparent shadow-md' : 'bg-white border-[#e2e8f0] text-[#8896ab] hover:border-[#cbd5e1] hover:text-[#475569]',
                          )}
                          style={active ? { backgroundColor: cfg?.color, borderColor: cfg?.color, boxShadow: `0 4px 16px ${cfg?.color}28` } : {}}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>

                  {tipoMedida === 'SUSPENSÃO' && (
                    <div className="mt-5 pt-5 border-t border-[#e8edf3] animate-in fade-in slide-in-from-top-2 duration-200">
                      <FieldLabel>Dias de Suspensão *</FieldLabel>
                      <input type="number" min={1} max={30} value={diasSuspensao}
                        onChange={e => setDiasSuspensao(e.target.value)} placeholder="Ex: 3"
                        className={cn(inputCls, 'w-36')} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="step-panel max-w-xl mx-auto">
                <StepHeader step={3} title="Gravidade da Ocorrência"
                  subtitle="Classifique a gravidade para definir os encaminhamentos necessários." />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.entries(GRAVIDADE_CFG) as [Gravidade, typeof GRAVIDADE_CFG[string]][]).map(([key, cfg]) => {
                    const active = gravidade === key
                    return (
                      <button key={key} type="button" onClick={() => setGravidade(key)}
                        className={cn(
                          'relative rounded-[20px] p-5 flex flex-col items-center gap-3 border-2 transition-all duration-200',
                          active ? 'scale-[1.03] shadow-md' : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1] hover:scale-[1.01]',
                        )}
                        style={active ? { backgroundColor: cfg.bg, borderColor: cfg.border } : {}}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: active ? cfg.color + '18' : '#f0f4f9' }}>
                          <AlertTriangle size={18} style={{ color: active ? cfg.color : '#8896ab' }} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wide text-center"
                          style={{ color: active ? cfg.color : '#8896ab' }}>{cfg.label}</span>
                        {active && (
                          <div className="absolute top-2.5 right-2.5">
                            <CheckCircle size={13} style={{ color: cfg.color }} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="step-panel max-w-xl mx-auto">
                <StepHeader step={4} title="Detalhamento"
                  subtitle="Selecione a classificação e descreva a ocorrência com detalhes." />
                <div className="bg-white rounded-[22px] border border-[#e8edf3] p-6 shadow-sm space-y-5">
                  <div>
                    <FieldLabel>Classificação da Ocorrência *</FieldLabel>
                    <div className="relative">
                      <button type="button" onClick={() => setShowDrop(p => !p)}
                        className={cn(
                          'w-full text-left rounded-2xl py-3.5 px-4 text-sm font-semibold flex items-center justify-between transition-all',
                          'bg-[#f8fafc] border border-[#e2e8f0]',
                          showDrop && 'border-[#094780]/35 ring-2 ring-[#094780]/06',
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
                                  classificacao === c
                                    ? 'text-[#094780] font-bold bg-[#094780]/4'
                                    : 'text-[#4a5568] font-medium',
                                )}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Descrição Detalhada *</FieldLabel>
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

            {/* STEP 5 */}
            {step === 5 && (
              <div className="step-panel max-w-xl mx-auto space-y-4">
                <StepHeader step={5} title="Anexos & Vínculo"
                  subtitle="Adicione documentos e vincule com uma inspeção CLICK se necessário." />

                <div className="bg-white rounded-[22px] border border-[#e8edf3] p-6 shadow-sm">
                  <FieldLabel>Documentos Anexos</FieldLabel>
                  <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
                    onChange={e => setAnexos(prev => [...prev, ...Array.from(e.target.files || [])])} />

                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#e2e8f0] rounded-2xl p-6 flex flex-col items-center gap-2.5 hover:border-[#094780]/30 hover:bg-[#094780]/[0.02] transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-[#f0f4f9] flex items-center justify-center group-hover:bg-[#094780]/08 transition-colors">
                      <Upload size={18} className="text-[#8896ab] group-hover:text-[#094780] transition-colors" />
                    </div>
                    <p className="text-[13px] font-bold text-[#8896ab] group-hover:text-[#094780] transition-colors">
                      Clique para adicionar imagem ou PDF
                    </p>
                    <p className="text-[10px] text-[#b0bac8]">PNG, JPG, PDF · múltiplos arquivos</p>
                  </button>

                  {anexos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {anexos.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#f8fafc] border border-[#e8edf3] rounded-xl px-4 py-3">
                          <div className="w-8 h-8 rounded-lg bg-[#094780]/08 flex items-center justify-center flex-shrink-0">
                            <Paperclip size={13} className="text-[#094780]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-[#1a2535] truncate">{file.name}</p>
                            <p className="text-[10px] text-[#8896ab]">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button"
                            onClick={() => setAnexos(p => p.filter((_, j) => j !== i))}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                            <X size={13} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[22px] border border-[#e8edf3] p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#094780]/08 flex items-center justify-center">
                        <Link2 size={15} className="text-[#094780]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1a2535]">Relacionar com o CLICK?</p>
                        <p className="text-[10px] text-[#8896ab]">Vincule a uma inspeção existente</p>
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
                    <div className="mt-5 pt-5 border-t border-[#e8edf3] animate-in fade-in slide-in-from-top-2 duration-200">
                      <FieldLabel>Número da Inspeção (CLICK) *</FieldLabel>
                      <div className="relative max-w-xs">
                        <ClipboardList size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8896ab] pointer-events-none" />
                        <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)}
                          placeholder="Ex: INSP-2025-0042" className={cn(inputCls, 'pl-10')} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="h-28" />
          </div>

          {/* ── Barra de navegação ────────────────────────────────────────── */}
          <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-[#e8edf3] px-8 sm:px-14 xl:px-20 py-4">
            <div className="max-w-xl mx-auto flex items-center justify-between gap-4">

              <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-bold border border-[#e2e8f0] text-[#8896ab] hover:text-[#1a2535] hover:border-[#cbd5e1] hover:bg-[#f8fafc] transition-all',
                  step === 1 && 'opacity-0 pointer-events-none',
                )}>
                <ChevronLeft size={15} /> Anterior
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {STEPS.map(s => (
                  <div key={s.id} className="rounded-full transition-all duration-300"
                    style={{
                      width: step === s.id ? '20px' : '7px', height: '7px',
                      background: step === s.id ? '#094780' : step > s.id ? '#10b981' : '#e2e8f0',
                    }} />
                ))}
              </div>

              {step < STEPS.length ? (
                <button type="button"
                  onClick={() => stepValid[step - 1] && setStep(s => s + 1)}
                  disabled={!stepValid[step - 1]}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wide transition-all',
                    stepValid[step - 1]
                      ? 'bg-[#094780] text-white hover:bg-[#0a5494] shadow-md shadow-[#094780]/20'
                      : 'bg-[#e2e8f0] text-[#b0bac8] cursor-not-allowed',
                  )}>
                  Próximo <ChevronRight size={15} />
                </button>
              ) : (
                <button type="button"
                  onClick={() => allValid && setSuccessModal(true)}
                  disabled={!allValid}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wide transition-all',
                    allValid
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-[#e2e8f0] text-[#b0bac8] cursor-not-allowed',
                  )}>
                  <ShieldAlert size={15} /> Registrar
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ══ MODAL SUCESSO ════════════════════════════════════════════════════ */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0d1e33]/60 backdrop-blur-md">
          <div className="modal-in bg-white rounded-[36px] w-full max-w-sm p-10 text-center shadow-2xl border border-[#e8edf3]">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
              <CheckCircle size={38} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-[#0d1e33] mb-1 uppercase italic"
              style={{ fontFamily: "'Syne', sans-serif" }}>Registrado!</h3>
            <p className="text-[10px] text-[#8896ab] font-bold uppercase tracking-[0.25em] mb-5">
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
              <div className="mb-5 mt-2 px-4 py-2.5 rounded-xl flex items-center gap-2 justify-center"
                style={{ backgroundColor: GRAVIDADE_CFG[gravidade]?.bg, border: `1px solid ${GRAVIDADE_CFG[gravidade]?.border}` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GRAVIDADE_CFG[gravidade]?.color }} />
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: GRAVIDADE_CFG[gravidade]?.color }}>
                  {GRAVIDADE_CFG[gravidade]?.label}
                </span>
              </div>
            )}
            {relacionarClick && numeroInspecao && (
              <div className="mb-5 px-4 py-2.5 rounded-xl bg-[#094780]/06 border border-[#094780]/12 flex items-center gap-2 justify-center">
                <Link2 size={12} className="text-[#094780]" />
                <span className="text-[11px] font-black text-[#094780] uppercase tracking-wider">{numeroInspecao}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 py-3.5 bg-[#094780] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0a5494] transition-all">
                NOVO REGISTRO
              </button>
              <button onClick={() => window.history.back()}
                className="flex-1 py-3.5 bg-[#f0f4f9] text-[#6b7a90] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#e8edf3] transition-all">
                VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </MedidaLayout>
  )
}