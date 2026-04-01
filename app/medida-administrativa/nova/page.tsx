'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  ShieldAlert, User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, X, Upload,
  Loader2, ClipboardList, Zap, ArrowLeft,
  CheckCircle2, ChevronDown,
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
  const { data: session } = useSession()
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [successModal, setSuccessModal] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Step 1 — Identificação
  const [nomeColab, setNomeColab]           = useState('') // Adicionado (Obrigatório no Prisma)
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

  // ─── LÓGICA DE INTEGRAÇÃO ──────────────────────────────────────────────────
  async function handleRegister() {
  if (isRegistering) return;
  
  const token = (session as any)?.access_token || (session as any)?.accessToken;

  if (!token) {
    alert('Erro: Token não encontrado. Faça login novamente.');
    return;
  }

  setIsRegistering(true);

  // MAPEAMENTO CORRETO PARA O SEU SCHEMA.PRISMA
  const payload = {
    colaborador: nomeColab,     // Nome do colaborador (String)
    matricula: matriculaColab,  // Mapeado para o campo 'matricula' do banco
    supervisor: matriculaSup,   // Mapeado para o campo 'supervisor' do banco (você pode enviar o nome ou a matrícula aqui)
    tipo: tipoCategoria,       // Mapeado para 'tipo' (SEGURANÇA / ADMINISTRATIVA)
    medida: tipoMedida,         // Mapeado para o campo 'medida' (ADVERTÊNCIA, etc)
    ocorrencia: ocorrencia,     // Mapeado para 'ocorrencia' (a descrição detalhada)
    gravidade: gravidade,
    classificacao: classificacao,
    // Note que diasSuspensao e numeroInspecaoClick não existem no seu Schema.prisma atual!
    // Se quiser salvá-los, precisará adicionar no model Medida.
  };

  try {
    const response = await fetch('http://localhost:3001/medidas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao registrar medida.');
    }

    setSuccessModal(true);
  } catch (error: any) {
    console.error('Erro no registro:', error);
    alert(error.message);
  } finally {
    setIsRegistering(false);
  }
}

  // ─── LÓGICA DE VALIDAÇÃO ──────────────────────────────────────────────────
  const validar = (val: string, set: typeof setStatusColab) => {
    if (val.length < 4) { set('idle'); return }
    set('loading')
    setTimeout(() => set('valid'), 600) // Liberado para qualquer matrícula no teste
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
  const isTabLocked = (key: TabKey) => {
    const idx = tabOrder.indexOf(key)
    return tabOrder.slice(0, idx).some(k => !tabValid[k])
  }
  const completedCount = tabOrder.filter(k => tabValid[k]).length
  const progressoPct = Math.round((completedCount / tabOrder.length) * 100)
  const allValid = tabOrder.every(k => tabValid[k])

  const reset = () => {
    setTab('identificacao')
    setNomeColab('')
    setMatriculaColab(''); setStatusColab('idle')
    setMatriculaSup(''); setStatusSup('idle'); setDataMedida('')
    setTipoCategoria(''); setTipoMedida(''); setDiasSuspensao('')
    setGravidade(''); setClassificacao(''); setOcorrencia('')
    setRelacionarClick(false); setNumeroInspecao('')
    setSuccessModal(false)
  }

  const inputCls = 'w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-3.5 px-4 text-sm font-semibold text-[#1a2535] outline-none focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/08 transition-all placeholder:font-normal placeholder:text-[#b0bac8]'
  const labelCls = 'text-[10px] font-black text-[#8896ab] uppercase tracking-[0.25em] mb-2 block'

  return (
    <MedidaLayout title="Nova Medida">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        .nm-root { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .modal-in { animation: zoomIn 0.28s cubic-bezier(.22,.68,0,1.2) forwards; }
        .prog-bar { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
      `}</style>

      <div className="nm-root w-full flex flex-col bg-white min-h-[calc(100vh-60px)]">
        {/* CABEÇALHO */}
        <div className="bg-white border-b border-[#e8edf3] px-6 pt-6 pb-0">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#8896ab] hover:text-[#094780] mb-5 group transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>

          <div className="flex items-start justify-between mb-5">
            <div>
              <span className="text-[9px] font-black text-[#094780] uppercase tracking-[0.35em]">SESMT · RH</span>
              <h1 className="text-[28px] font-black tracking-tighter text-[#0d1e33] uppercase mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>Nova Medida</h1>
            </div>
            <div className="bg-[#f0f4f9] p-2.5 rounded-xl border border-[#e2e8f0]">
              <ShieldAlert size={20} className="text-[#094780]" />
            </div>
          </div>

          <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden mb-5">
            <div className="prog-bar h-full rounded-full" style={{ width: `${progressoPct}%`, background: progressoPct === 100 ? '#10b981' : 'linear-gradient(90deg,#094780,#3b82f6)' }} />
          </div>

          <div className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => !isTabLocked(t.key) && setTab(t.key)}
                className={cn('flex items-center gap-2 px-5 py-3.5 text-[12px] font-bold border-b-2 transition-all whitespace-nowrap',
                  tab === t.key ? 'text-[#094780] border-[#094780]' : isTabLocked(t.key) ? 'text-[#c8d0dc] border-transparent cursor-not-allowed' : 'text-[#8896ab] border-transparent'
                )}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 pt-6 pb-32">
          {tab === 'identificacao' && (
            <div className="space-y-3 max-w-2xl mx-auto fade-up">
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm space-y-5">
                <div>
                  <label className={labelCls}>Nome do Colaborador *</label>
                  <input type="text" value={nomeColab} onChange={e => setNomeColab(e.target.value)} placeholder="Nome completo" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Matrícula Colab. *</label>
                        <input type="text" value={matriculaColab} onChange={e => { setMatriculaColab(e.target.value); validar(e.target.value, setStatusColab) }} placeholder="Ex: M1234" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Matrícula Sup. *</label>
                        <input type="text" value={matriculaSup} onChange={e => { setMatriculaSup(e.target.value); validar(e.target.value, setStatusSup) }} placeholder="Ex: M5678" className={inputCls} />
                    </div>
                </div>
                <div>
                  <label className={labelCls}>Data da Medida *</label>
                  <input type="date" value={dataMedida} onChange={e => setDataMedida(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {tab === 'classificacao' && (
            <div className="space-y-2.5 max-w-2xl mx-auto fade-up">
               <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm">
                <label className={labelCls}>Categoria *</label>
                <div className="flex gap-2.5">
                  {['SEGURANÇA', 'ADMINISTRATIVA'].map(opt => (
                    <button key={opt} onClick={() => setTipoCategoria(opt as TipoCategoria)} className={cn('px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase border-2 transition-all', tipoCategoria === opt ? 'bg-[#094780] text-white border-[#094780]' : 'bg-white text-[#8896ab] border-[#e2e8f0]')}>{opt}</button>
                  ))}
                </div>
              </div>
              {['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'].map((opt) => (
                <div key={opt} onClick={() => setTipoMedida(opt as TipoMedida)} className={cn('bg-white rounded-[20px] border px-5 py-4 flex items-center justify-between cursor-pointer transition-all', tipoMedida === opt ? 'border-[#094780] bg-[#094780]/05' : 'border-[#e8edf3]')}>
                  <span className="text-[13px] font-semibold">{opt}</span>
                  <CheckCircle2 size={18} className={tipoMedida === opt ? 'text-[#094780]' : 'text-[#e2e8f0]'} />
                </div>
              ))}
              {tipoMedida === 'SUSPENSÃO' && (
                <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 fade-up">
                    <label className={labelCls}>Dias de Suspensão *</label>
                    <input type="number" value={diasSuspensao} onChange={e => setDiasSuspensao(e.target.value)} placeholder="Quantidade de dias" className={inputCls} />
                </div>
              )}
            </div>
          )}

          {tab === 'gravidade' && (
            <div className="space-y-2.5 max-w-2xl mx-auto fade-up">
              {Object.keys(GRAVIDADE_CFG).map((key) => (
                <div key={key} onClick={() => setGravidade(key as Gravidade)} className={cn('bg-white rounded-[20px] border px-5 py-4 flex items-center justify-between cursor-pointer transition-all', gravidade === key ? 'border-[#094780] bg-[#094780]/05' : 'border-[#e8edf3]')}>
                  <span className="text-[13px] font-semibold">{key}</span>
                  <div className="w-4 h-4 rounded-full" style={{ background: GRAVIDADE_CFG[key].color }} />
                </div>
              ))}
            </div>
          )}

          {tab === 'ocorrencia' && (
            <div className="space-y-4 max-w-2xl mx-auto fade-up">
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5">
                  <label className={labelCls}>Classificação da Ocorrência *</label>
                  <select value={classificacao} onChange={e => setClassificacao(e.target.value)} className={inputCls}>
                    <option value="">Selecione...</option>
                    {CLASSIFICACOES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5">
                  <label className={labelCls}>Descrição Detalhada *</label>
                  <textarea value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} rows={6} placeholder="Descreva o ocorrido com detalhes..." className={inputCls} />
              </div>
            </div>
          )}

          {tab === 'anexos' && (
            <div className="space-y-3 max-w-2xl mx-auto fade-up">
               <div className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-5 shadow-sm">
                <button type="button" onClick={() => setRelacionarClick(!relacionarClick)} className={cn('w-full py-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold text-sm', relacionarClick ? 'bg-[#094780] text-white border-[#094780]' : 'bg-white text-[#8896ab] border-[#e2e8f0]')}>
                  <Link2 size={16} /> Relacionar com CLICK?
                </button>
                {relacionarClick && (
                    <div className="mt-4 fade-up">
                         <label className={labelCls}>Número da Inspeção *</label>
                         <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)} placeholder="Ex: INSP-2026-001" className={inputCls} />
                    </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BARRA INFERIOR FIXA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t px-6 py-4">
          <button
            disabled={currentIdx < tabOrder.length - 1 ? !tabValid[tab] : (!allValid || isRegistering)}
            onClick={() => {
              if (currentIdx < tabOrder.length - 1) {
                setTab(tabOrder[currentIdx + 1])
              } else {
                handleRegister()
              }
            }}
            className={cn('w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all text-[12px] uppercase tracking-widest shadow-lg',
              (currentIdx < tabOrder.length - 1 ? tabValid[tab] : allValid) && !isRegistering 
                ? 'bg-[#094780] shadow-[#094780]/20' 
                : 'bg-[#d1d9e6] text-[#8896ab] cursor-not-allowed shadow-none'
            )}>
            {isRegistering ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {currentIdx < tabOrder.length - 1 ? 'Próximo' : 'Registrar Medida'}
          </button>
        </div>

        {/* MODAL SUCESSO */}
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1e33]/80 backdrop-blur-md p-6">
            <div className="modal-in bg-white rounded-[36px] w-full max-w-xs p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#0d1e33] mb-2 uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>Registrado!</h3>
              <p className="text-xs text-[#8896ab] font-medium mb-8">A medida foi salva com sucesso no sistema.</p>
              <button className="w-full py-4 bg-[#094780] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0a5494] transition-all" onClick={reset}>Novo Registro →</button>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}