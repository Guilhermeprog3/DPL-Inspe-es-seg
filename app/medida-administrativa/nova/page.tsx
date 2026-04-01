'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  ShieldAlert, User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, Loader2, Zap, ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos e Configurações ──────────────────────────────────────────────────
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

const GRAVIDADE_CFG: Record<string, { color: string }> = {
  LEVE:       { color: '#10b981' },
  MÉDIA:      { color: '#f59e0b' },
  GRAVE:      { color: '#ef4444' },
  GRAVÍSSIMA: { color: '#a855f7' },
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
  const { data: session } = useSession()
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [successModal, setSuccessModal] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Step 1 — Identificação
  const [nomeColab, setNomeColab]           = useState('')
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

  // Step 5 — Anexos
  const [relacionarClick, setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao]   = useState('')

  // ─── INTEGRAÇÃO ───────────────────────────────────────────────────────────
  async function handleRegister() {
    if (isRegistering) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) { alert('Erro: Token não encontrado. Faça login novamente.'); return }
    setIsRegistering(true)
    const payload = {
      colaborador: nomeColab,
      matricula: matriculaColab,
      supervisor: matriculaSup,
      tipo: tipoCategoria,
      medida: tipoMedida,
      ocorrencia,
      gravidade,
      classificacao,
    }
    try {
      const response = await fetch('http://localhost:3001/medidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao registrar medida.')
      }
      setSuccessModal(true)
    } catch (error: any) {
      console.error('Erro no registro:', error)
      alert(error.message)
    } finally {
      setIsRegistering(false)
    }
  }

  // ─── VALIDAÇÃO ────────────────────────────────────────────────────────────
  const validar = (val: string, set: typeof setStatusColab) => {
    if (val.length < 4) { set('idle'); return }
    set('loading')
    setTimeout(() => set('valid'), 600)
  }

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nomeColab && statusColab === 'valid' && statusSup === 'valid' && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade:     !!gravidade,
    ocorrencia:    !!classificacao && ocorrencia.trim().length >= 10,
    anexos:        !relacionarClick || !!numeroInspecao.trim(),
  }

  const tabOrder: TabKey[] = ['identificacao', 'classificacao', 'gravidade', 'ocorrencia', 'anexos']
  const currentIdx = tabOrder.indexOf(tab)
  const allValid = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  const reset = () => {
    setTab('identificacao')
    setNomeColab(''); setMatriculaColab(''); setStatusColab('idle')
    setMatriculaSup(''); setStatusSup('idle'); setDataMedida('')
    setTipoCategoria(''); setTipoMedida(''); setDiasSuspensao('')
    setGravidade(''); setClassificacao(''); setOcorrencia('')
    setRelacionarClick(false); setNumeroInspecao('')
    setSuccessModal(false)
  }

  // ─── ESTILOS COMPARTILHADOS ───────────────────────────────────────────────
  const inputCls = cn(
    'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3',
    'text-[13.5px] font-normal text-[#111827] outline-none',
    'focus:border-[#3d6cf0] focus:ring-2 focus:ring-[#3d6cf0]/10',
    'transition-all placeholder:text-[#9ca3af]'
  )

  const formRowCls = cn(
    'grid gap-4 items-start sm:items-center px-4 sm:px-6 py-4',
    'border-b border-[#e3e8ef] last:border-b-0',
    'hover:bg-[#fafbfd] transition-colors'
  )

  const labelCls = 'text-[13.5px] font-medium text-[#111827]'
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-4 sm:px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'

  return (
    <MedidaLayout title="Nova Medida">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .modal-in { animation: zoomIn 0.25s cubic-bezier(.22,.68,0,1.2) forwards; }
      `}</style>

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]" style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}>

        {/* ── BREADCRUMB ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <button onClick={() => window.history.back()} className="hover:text-[#3d6cf0] transition-colors">Início</button>
          <span className="text-[11px]">›</span>
          <span className="text-[#3d6cf0] font-semibold">Nova Medida</span>
        </div>

        {/* ── TABS BAR ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map((t) => {
            const isActive = tab === t.key
            const isComplete = tabValid[t.key]
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-[14px] text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                  isActive
                    ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold'
                    : 'text-[#9ca3af] border-transparent hover:text-[#4b5563]'
                )}
              >
                {t.label}
                {isComplete && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>
            )
          })}
        </div>

        {/* ── CONTEÚDO ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 w-full">

          {/* TAB: IDENTIFICAÇÃO */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Dados do colaborador</div>

                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className={labelCls}>Nome do Colaborador <span className="text-[#3d6cf0]">*</span></span>
                  <input
                    type="text" value={nomeColab}
                    onChange={e => setNomeColab(e.target.value)}
                    placeholder="Nome completo do colaborador"
                    className={inputCls}
                  />
                </div>

                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr_1fr]')}>
                  <span className={cn(labelCls, 'flex flex-col')}>
                    Matrícula <span className="text-[11px] font-normal text-[#9ca3af]">Colaborador e Supervisor</span>
                    <span className="text-[#3d6cf0] text-base leading-none">*</span>
                  </span>
                  <input
                    type="text" value={matriculaColab}
                    onChange={e => { setMatriculaColab(e.target.value); validar(e.target.value, setStatusColab) }}
                    placeholder="Colab. Ex: M1234"
                    className={inputCls}
                  />
                  <input
                    type="text" value={matriculaSup}
                    onChange={e => { setMatriculaSup(e.target.value); validar(e.target.value, setStatusSup) }}
                    placeholder="Sup. Ex: M5678"
                    className={inputCls}
                  />
                </div>

                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className={labelCls}>Data da Medida <span className="text-[#3d6cf0]">*</span></span>
                  <input
                    type="date" value={dataMedida}
                    onChange={e => setDataMedida(e.target.value)}
                    className={cn(inputCls, 'sm:max-w-[200px]')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLASSIFICAÇÃO */}
          {tab === 'classificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Categoria</div>
                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className={labelCls}>Categoria <span className="text-[#3d6cf0]">*</span></span>
                  <div className="flex gap-2">
                    {(['SEGURANÇA', 'ADMINISTRATIVA'] as TipoCategoria[]).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setTipoCategoria(opt)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-[12.5px] font-semibold border-[1.5px] transition-all',
                          tipoCategoria === opt
                            ? 'bg-[#3d6cf0] text-white border-[#3d6cf0]'
                            : 'bg-white text-[#4b5563] border-[#e3e8ef] hover:border-[#3d6cf0] hover:text-[#3d6cf0]'
                        )}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Tipo de medida</div>
                <div className="p-4 flex flex-col gap-2">
                  {(['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'] as TipoMedida[]).map(opt => (
                    <div
                      key={opt}
                      onClick={() => setTipoMedida(opt)}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-lg border-[1.5px] cursor-pointer transition-all',
                        tipoMedida === opt
                          ? 'border-[#3d6cf0] bg-[#eef2ff]'
                          : 'border-[#e3e8ef] bg-white hover:border-[#3d6cf0] hover:bg-[#eef2ff]'
                      )}
                    >
                      <span className="text-[13.5px] font-medium text-[#111827]">{opt}</span>
                      <div className={cn(
                        'w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all',
                        tipoMedida === opt ? 'border-[#3d6cf0] bg-[#3d6cf0]' : 'border-[#e3e8ef] bg-white'
                      )}>
                        {tipoMedida === opt && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                      </div>
                    </div>
                  ))}
                </div>

                {tipoMedida === 'SUSPENSÃO' && (
                  <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]', 'border-t border-[#e3e8ef]')}>
                    <span className={labelCls}>Dias de Suspensão <span className="text-[#3d6cf0]">*</span></span>
                    <input
                      type="number" value={diasSuspensao}
                      onChange={e => setDiasSuspensao(e.target.value)}
                      placeholder="Quantidade de dias"
                      className={cn(inputCls, 'sm:max-w-[160px]')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GRAVIDADE */}
          {tab === 'gravidade' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Nível de gravidade</div>
                <div className="p-4 flex flex-col gap-2">
                  {(Object.keys(GRAVIDADE_CFG) as Gravidade[]).map(key => (
                    <div
                      key={key}
                      onClick={() => setGravidade(key)}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-lg border-[1.5px] cursor-pointer transition-all',
                        gravidade === key
                          ? 'border-[#3d6cf0] bg-[#eef2ff]'
                          : 'border-[#e3e8ef] bg-white hover:border-[#3d6cf0] hover:bg-[#eef2ff]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: GRAVIDADE_CFG[key!].color }} />
                        <span className="text-[13.5px] font-medium text-[#111827]">{key}</span>
                      </div>
                      <div className={cn(
                        'w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all',
                        gravidade === key ? 'border-[#3d6cf0] bg-[#3d6cf0]' : 'border-[#e3e8ef] bg-white'
                      )}>
                        {gravidade === key && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: OCORRÊNCIA */}
          {tab === 'ocorrencia' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Detalhes da ocorrência</div>

                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className={labelCls}>Classificação <span className="text-[#3d6cf0]">*</span></span>
                  <div className="relative">
                    <select
                      value={classificacao}
                      onChange={e => setClassificacao(e.target.value)}
                      className={cn(inputCls, 'pr-9 cursor-pointer appearance-none')}
                    >
                      <option value="">Selecione...</option>
                      {CLASSIFICACOES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]', 'items-start pt-4')}>
                  <span className={labelCls}>Descrição Detalhada <span className="text-[#3d6cf0]">*</span></span>
                  <textarea
                    value={ocorrencia}
                    onChange={e => setOcorrencia(e.target.value)}
                    rows={6}
                    placeholder="Descreva o ocorrido com detalhes..."
                    className={cn(inputCls, 'h-auto py-2.5 resize-y leading-relaxed')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANEXOS */}
          {tab === 'anexos' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Vínculo com inspeção <span className="normal-case font-normal tracking-normal">(opcional)</span></div>

                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className={labelCls}>Relacionar com CLICK?</span>
                  <button
                    type="button"
                    onClick={() => setRelacionarClick(!relacionarClick)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-[1.5px] text-[13px] font-semibold transition-all max-w-max',
                      relacionarClick
                        ? 'bg-[#3d6cf0] border-[#3d6cf0] text-white'
                        : 'bg-white border-[#e3e8ef] text-[#4b5563] hover:border-[#3d6cf0] hover:text-[#3d6cf0]'
                    )}
                  >
                    <Link2 size={14} /> Vincular inspeção
                  </button>
                </div>

                {relacionarClick && (
                  <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]', 'fade-up')}>
                    <span className={labelCls}>Número da Inspeção <span className="text-[#3d6cf0]">*</span></span>
                    <input
                      type="text" value={numeroInspecao}
                      onChange={e => setNumeroInspecao(e.target.value)}
                      placeholder="Ex: INSP-2026-001"
                      className={cn(inputCls, 'sm:max-w-[260px]')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER FIXO ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#e3e8ef] px-7 py-3.5 flex items-center justify-between">
          <div className="text-[12px] text-[#9ca3af]">
            Etapa <span className="font-semibold text-[#4b5563]">{currentIdx + 1}</span> de 5
            &nbsp;·&nbsp;
            <span className={cn('font-semibold', completedCount === 5 ? 'text-emerald-500' : 'text-[#4b5563]')}>
              {completedCount === 5 ? '✓ Pronto para registrar' : `${completedCount} de 5 completas`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentIdx > 0 && (
              <button
                onClick={() => setTab(tabOrder[currentIdx - 1])}
                className="px-4 py-2 rounded-lg border border-[#e3e8ef] text-[13px] font-medium text-[#4b5563] hover:border-[#9ca3af] hover:text-[#111827] transition-all"
              >
                ← Voltar
              </button>
            )}
            <button
              disabled={currentIdx < tabOrder.length - 1 ? false : (!allValid || isRegistering)}
              onClick={() => {
                if (currentIdx < tabOrder.length - 1) setTab(tabOrder[currentIdx + 1])
                else handleRegister()
              }}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all',
                currentIdx < tabOrder.length - 1
                  ? 'bg-[#3d6cf0] text-white hover:bg-[#2d5ce0]'
                  : allValid && !isRegistering
                    ? 'bg-[#3d6cf0] text-white hover:bg-[#2d5ce0]'
                    : 'bg-[#e3e8ef] text-[#9ca3af] cursor-not-allowed'
              )}
            >
              {isRegistering
                ? <Loader2 size={14} className="animate-spin" />
                : currentIdx < tabOrder.length - 1
                  ? null
                  : <Zap size={14} />
              }
              {currentIdx < tabOrder.length - 1 ? 'Próximo →' : 'Salvar Medida'}
            </button>
          </div>
        </div>

        {/* ── MODAL SUCESSO ── */}
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 backdrop-blur-md p-6">
            <div className="modal-in bg-white rounded-2xl w-full max-w-xs p-10 text-center shadow-2xl border border-[#e3e8ef]">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-[17px] font-bold text-[#111827] mb-2">Medida Registrada!</h3>
              <p className="text-[13px] text-[#9ca3af] mb-6 leading-relaxed">A medida disciplinar foi salva com sucesso no sistema.</p>
              <button
                onClick={reset}
                className="w-full py-2.5 bg-[#3d6cf0] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2d5ce0] transition-all"
              >
                Novo Registro →
              </button>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}