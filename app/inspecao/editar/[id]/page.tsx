'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, ShieldCheck, Wrench, CheckCircle, CheckCircle2,
  XCircle, MinusCircle, AlertCircle, Loader2, Search,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos / Config ───────────────────────────────────────────────────────────
type RespostaKey = 'ok' | 'nao_conforme' | 'na'
type AcaoStatusKey = 'a_atribuir' | 'a_iniciar' | 'em_andamento' | 'cancelado' | 'concluido' | ''

type ItemChecklist = { id: string; pergunta: string; resposta: RespostaKey | '' }

type AcaoCorretiva = {
  status: AcaoStatusKey
  dataVencimento: string
  titulo: string
  descricao: string
  numNaoConformidade: string
  empresaResponsavel: string
  nomeResponsavel: string
  emailsCopia: string
}

const STATUS_OPTIONS: { value: AcaoStatusKey; label: string; color: string }[] = [
  { value: 'a_atribuir',   label: 'A Atribuir',   color: '#6b7a90' },
  { value: 'a_iniciar',    label: 'A Iniciar',     color: '#3b82f6' },
  { value: 'em_andamento', label: 'Em Andamento',  color: '#f59e0b' },
  { value: 'cancelado',    label: 'Cancelado',     color: '#ef4444' },
  { value: 'concluido',    label: 'Concluído',     color: '#10b981' },
]

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Extintor':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'Hidrante':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'Sprinkler': { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
  'Detector':  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
}

// ─── Mock — substituir por fetch real ─────────────────────────────────────────
const MOCK_INSPECAO = {
  id: 'INS-0041',
  equipId: 'EQ-9921',
  equipamento: 'Extintor CO₂ – Bloco A',
  tipo: 'Extintor',
  inspetor: 'Carlos Mendes',
  regional: 'Metropolitana',
  data: '2026-03-19T10:32:00',
  status: 'aprovado',
  checklist: [
    { id: 'c1', pergunta: 'Selo de garantia intacto?',              resposta: 'ok'           as RespostaKey },
    { id: 'c2', pergunta: 'Manômetro na faixa verde?',              resposta: 'ok'           as RespostaKey },
    { id: 'c3', pergunta: 'Mangueira e bico sem obstruções?',       resposta: 'nao_conforme' as RespostaKey },
    { id: 'c4', pergunta: 'Pino de segurança e lacre presentes?',   resposta: 'ok'           as RespostaKey },
    { id: 'c5', pergunta: 'Rótulo legível e dentro da validade?',   resposta: 'ok'           as RespostaKey },
    { id: 'c6', pergunta: 'Extintor acessível e sinalizado?',       resposta: 'na'           as RespostaKey },
  ],
  acaoCorretiva: {
    status: 'em_andamento' as AcaoStatusKey,
    dataVencimento: '2026-04-10',
    titulo: 'Substituição da mangueira',
    descricao: 'A mangueira apresenta rachadura próxima ao bico. Deve ser substituída antes do prazo de vencimento.',
    numNaoConformidade: 'c3',
    empresaResponsavel: 'SafeFire Manutenção Ltda.',
    nomeResponsavel: 'Ricardo Pinto',
    emailsCopia: 'seguranca@empresa.com, manutencao@empresa.com',
  },
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'checklist' as const, label: 'Inspeção',        icon: ClipboardList },
  { key: 'acao'      as const, label: 'Ação Corretiva',  icon: Wrench        },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditarInspecaoPage() {
  const router  = useRouter()
  const params  = useParams()
  const { data: session } = useSession()

  const id = params?.id as string

  const [loading, setLoading]     = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [tab, setTab]             = useState<TabKey>('checklist')

  // ── Dados do equipamento (somente leitura nesta tela) ──
  const [equipamento, setEquipamento] = useState('')
  const [equipId, setEquipId]         = useState('')
  const [tipo, setTipo]               = useState('')
  const [inspetor, setInspetor]       = useState('')
  const [regional, setRegional]       = useState('')
  const [dataInspecao, setDataInspecao] = useState('')

  // ── Checklist ──
  const [itens, setItens] = useState<ItemChecklist[]>([])

  // ── Ação Corretiva ──
  const [acao, setAcao] = useState<AcaoCorretiva>({
    status: '', dataVencimento: '', titulo: '', descricao: '',
    numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '',
  })

  // ── Fetch ──
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true)
      try {
        // const token = (session as any)?.access_token || (session as any)?.accessToken
        // const res = await fetch(`http://localhost:3001/inspecoes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        // const data = await res.json()
        await new Promise(r => setTimeout(r, 500))
        const data = MOCK_INSPECAO

        setEquipamento(data.equipamento)
        setEquipId(data.equipId)
        setTipo(data.tipo)
        setInspetor(data.inspetor)
        setRegional(data.regional)
        setDataInspecao(data.data.split('T')[0])
        setItens(data.checklist.map(c => ({ ...c, resposta: c.resposta as RespostaKey | '' })))
        if (data.acaoCorretiva) setAcao(data.acaoCorretiva)
      } catch { console.error('Falha ao carregar') }
      finally { setLoading(false) }
    }
    fetch_()
  }, [id, session])

  // ── Handlers ──
  const handleToggle = (itemId: string, valor: RespostaKey) => {
    setItens(prev => prev.map(i => i.id === itemId ? { ...i, resposta: valor } : i))
  }

  const itensNaoConformes = itens.filter(i => i.resposta === 'nao_conforme')
  const temNaoConformidade = itensNaoConformes.length > 0

  const progressoPct = itens.length > 0
    ? Math.round((itens.filter(i => i.resposta !== '').length / itens.length) * 100)
    : 0

  const checklistOk = itens.length > 0 && itens.every(i => i.resposta !== '')
  const acaoOk = acao.status !== '' && !!acao.dataVencimento && !!acao.titulo
    && !!acao.descricao && !!acao.empresaResponsavel && !!acao.nomeResponsavel

  const tabValid: Record<TabKey, boolean> = {
    checklist: checklistOk,
    acao: !temNaoConformidade || acaoOk,
  }
  const tabOrder: TabKey[] = temNaoConformidade ? ['checklist', 'acao'] : ['checklist']
  const currentIdx = tabOrder.indexOf(tab) === -1 ? 0 : tabOrder.indexOf(tab)
  const allValid = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  const tipoCfg = TIPO_CONFIG[tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      // const token = (session as any)?.access_token || (session as any)?.accessToken
      // await fetch(`http://localhost:3001/inspecoes/${id}`, { method: 'PUT', ... })
      await new Promise(r => setTimeout(r, 800))
      setSuccessModal(true)
    } catch { alert('Erro ao salvar.') }
    finally { setIsSaving(false) }
  }

  // ── Estilos compartilhados ──
  const inputCls        = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls        = 'text-[13.5px] font-medium text-[#111827]'

  if (loading) {
    return (
      <DashboardLayout title="Editar Inspeção">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Editar Inspeção">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        .scale-in { animation: scaleIn 0.15s ease forwards; }
        .prog-bar { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
      ` }} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── Breadcrumb ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => router.push('/inspecao')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Inspeções
            </button>
            <span className="text-[11px]">›</span>
            <button
              onClick={() => router.push(`/inspecao/${id}`)}
              className="hover:text-[#3d6cf0] transition-colors font-medium"
            >
              {id}
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Editar</span>
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

          {/* ══ TAB CHECKLIST ══ */}
          {tab === 'checklist' && (
            <div className="fade-up space-y-4">

              {/* Info do equipamento — somente leitura */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Equipamento Inspecionado</div>
                <div className="px-6 py-4 flex items-center justify-between border-b border-[#f1f5f9]">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                      style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                    >
                      <ShieldCheck size={18} style={{ color: tipoCfg.color }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-[#111827]">{equipamento}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                          style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}
                        >
                          {tipo}
                        </span>
                        <span className="text-[10px] font-mono text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{equipId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">Inspetor</p>
                    <p className="text-[13px] font-semibold text-[#111827] mt-0.5">{inspetor}</p>
                    <p className="text-[11px] text-[#9ca3af]">{regional}</p>
                  </div>
                </div>

                {/* Data editável */}
                <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                  <span className={labelCls}>Data da Inspeção *</span>
                  <input
                    type="date"
                    value={dataInspecao}
                    onChange={e => setDataInspecao(e.target.value)}
                    className={cn(inputCls, 'max-w-[200px]')}
                  />
                </div>

                {/* Barra de progresso */}
                {itens.length > 0 && (
                  <div className="px-6 pb-4 border-t border-[#e3e8ef] pt-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1.5">
                      <span>Progresso</span>
                      <span>{itens.filter(i => i.resposta !== '').length}/{itens.length} itens · {progressoPct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden">
                      <div
                        className="prog-bar h-full rounded-full"
                        style={{
                          width: `${progressoPct}%`,
                          background: progressoPct === 100 ? '#10b981' : 'linear-gradient(90deg,#3d6cf0,#60a5fa)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Itens do checklist */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Itens de Verificação</div>
                <div className="divide-y divide-[#f1f5f9]">
                  {itens.map((item, idx) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#fafbff] transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-[10px] font-black text-[#d1d5db] w-5 flex-shrink-0 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="text-[13.5px] font-medium text-[#111827] leading-snug">{item.pergunta}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {/* OK */}
                        <button
                          onClick={() => handleToggle(item.id, 'ok')}
                          className={cn(
                            'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all',
                            item.resposta === 'ok'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                              : 'bg-white border-[#e3e8ef] text-[#d1d5db] hover:border-emerald-300 hover:text-emerald-500',
                          )}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        {/* NC */}
                        <button
                          onClick={() => handleToggle(item.id, 'nao_conforme')}
                          className={cn(
                            'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all',
                            item.resposta === 'nao_conforme'
                              ? 'bg-red-500 border-red-500 text-white shadow-sm'
                              : 'bg-white border-[#e3e8ef] text-[#d1d5db] hover:border-red-300 hover:text-red-500',
                          )}
                        >
                          <XCircle size={14} />
                        </button>
                        {/* N/A */}
                        <button
                          onClick={() => handleToggle(item.id, 'na')}
                          className={cn(
                            'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all',
                            item.resposta === 'na'
                              ? 'bg-slate-500 border-slate-500 text-white shadow-sm'
                              : 'bg-white border-[#e3e8ef] text-[#d1d5db] hover:border-slate-300 hover:text-slate-500',
                          )}
                        >
                          <MinusCircle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Legenda */}
                <div className="px-6 py-3 bg-[#f8fafc] border-t border-[#e3e8ef] flex items-center gap-5">
                  {[
                    { icon: CheckCircle2, label: 'Conforme',      color: '#10b981' },
                    { icon: XCircle,      label: 'Não Conforme',  color: '#ef4444' },
                    { icon: MinusCircle,  label: 'Não Aplicável', color: '#64748b' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={11} style={{ color }} />
                      <span className="text-[10px] text-[#9ca3af] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB AÇÃO CORRETIVA ══ */}
          {tab === 'acao' && (
            <div className="fade-up space-y-4">

              {/* Status */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Status da Ação *</div>
                <div className="p-4 space-y-1.5">
                  {STATUS_OPTIONS.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setAcao(a => ({ ...a, status: opt.value }))}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all',
                        acao.status === opt.value
                          ? 'border-[#3d6cf0] bg-blue-50/50'
                          : 'border-slate-50 hover:border-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                        <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                      </div>
                      {acao.status === opt.value && <CheckCircle size={16} className="text-[#3d6cf0]" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhes */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Detalhes da Ação</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Data Limite *</span>
                    <input
                      type="date"
                      value={acao.dataVencimento}
                      onChange={e => setAcao(a => ({ ...a, dataVencimento: e.target.value }))}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Título da Ação *</span>
                    <input
                      type="text"
                      value={acao.titulo}
                      onChange={e => setAcao(a => ({ ...a, titulo: e.target.value }))}
                      className={inputCls}
                      placeholder="Ex: Troca de mangueira"
                    />
                  </div>
                  <div className="grid gap-4 items-start px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={cn(labelCls, 'mt-2')}>Descrição Detalhada *</span>
                    <textarea
                      value={acao.descricao}
                      onChange={e => setAcao(a => ({ ...a, descricao: e.target.value }))}
                      placeholder="Descreva o que deve ser feito..."
                      rows={4}
                      className={cn(inputCls, 'h-auto py-2.5 resize-none leading-relaxed')}
                    />
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Responsável</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Não Conformidade</span>
                    <select
                      value={acao.numNaoConformidade}
                      onChange={e => setAcao(a => ({ ...a, numNaoConformidade: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">— Selecionar —</option>
                      {itensNaoConformes.map((nc, i) => (
                        <option key={nc.id} value={nc.id}>{i + 1} — {nc.pergunta}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Empresa Responsável *</span>
                    <input
                      type="text"
                      value={acao.empresaResponsavel}
                      onChange={e => setAcao(a => ({ ...a, empresaResponsavel: e.target.value }))}
                      className={inputCls}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nome do Responsável *</span>
                    <input
                      type="text"
                      value={acao.nomeResponsavel}
                      onChange={e => setAcao(a => ({ ...a, nomeResponsavel: e.target.value }))}
                      className={inputCls}
                      placeholder="Nome do técnico/encarregado"
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Copiar E-mail(s)</span>
                    <input
                      type="text"
                      value={acao.emailsCopia}
                      onChange={e => setAcao(a => ({ ...a, emailsCopia: e.target.value }))}
                      className={inputCls}
                      placeholder="e-mails separados por vírgula"
                    />
                  </div>
                </div>
              </div>

              {/* Aviso se não há não conformidades */}
              {!temNaoConformidade && (
                <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-emerald-700 font-medium leading-relaxed">
                    Nenhuma não conformidade encontrada no checklist. A ação corretiva é opcional.
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
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-all',
                    tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200'
                  )}
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

            {/* Checklist → próximo ou salvar */}
            {tab === 'checklist' && (
              <button
                disabled={!checklistOk}
                onClick={() => {
                  if (temNaoConformidade) setTab('acao')
                  else handleSave()
                }}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                  checklistOk ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed'
                )}
              >
                {isSaving
                  ? <Loader2 className="animate-spin" size={16} />
                  : temNaoConformidade ? 'PRÓXIMO' : 'SALVAR ALTERAÇÕES'
                }
              </button>
            )}

            {/* Ação Corretiva → salvar */}
            {tab === 'acao' && (
              <button
                disabled={(!acaoOk && temNaoConformidade) || isSaving}
                onClick={handleSave}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                  (acaoOk || !temNaoConformidade) && !isSaving ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed'
                )}
              >
                {isSaving
                  ? <Loader2 className="animate-spin" size={16} />
                  : 'SALVAR ALTERAÇÕES'
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
              <h3 className="font-black text-xl text-slate-800 mb-2">Salvo!</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                As alterações foram salvas com sucesso.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/inspecao')}
                  className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs"
                >
                  VER LISTA
                </button>
                <button
                  onClick={() => router.push(`/inspecao/${id}`)}
                  className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs"
                >
                  VER DETALHES
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}