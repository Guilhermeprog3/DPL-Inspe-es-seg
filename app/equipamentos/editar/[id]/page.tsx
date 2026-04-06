'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
  Package, MapPin, Hash,
  Flame, Droplets, Zap, Bell, Wind, Plus, ChevronDown,
  ShieldCheck, CalendarClock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Config (igual ao cadastro) ───────────────────────────────────────────────
type StatusEquip = 'ativo' | 'vencido' | 'manutencao' | 'inativo'

const STATUS_OPTIONS: { value: StatusEquip; label: string; color: string }[] = [
  { value: 'ativo',      label: 'Ativo',      color: '#059669' },
  { value: 'vencido',    label: 'Vencido',    color: '#d97706' },
  { value: 'manutencao', label: 'Manutenção', color: '#dc2626' },
  { value: 'inativo',    label: 'Inativo',    color: '#6b7280' },
]

const TIPO_OPTIONS: { value: string; labelShort: string; icon: any; color: string; bg: string; border: string }[] = [
  { value: 'Extintor',                 labelShort: 'Extintor',     icon: Flame,    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'Hidrante',                 labelShort: 'Hidrante',     icon: Droplets, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'Iluminação de Emergência', labelShort: 'Ilumin. Emg.', icon: Zap,      color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'Botoeiras e Sirenes',      labelShort: 'Botoeiras',    icon: Bell,     color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  { value: 'Detector de Fumaça',       labelShort: 'Det. Fumaça',  icon: Wind,     color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
]

const EXTINTOR_CLASSE_OPTIONS = [
  { value: 'ABC',   label: 'ABC  — Pó Químico Seco (A, B e C)'  },
  { value: 'BC',    label: 'BC   — Pó Químico Seco (B e C)'     },
  { value: 'AB',    label: 'AB   — Água + Espuma (A e B)'       },
  { value: 'A',     label: 'A    — Água (classe A)'             },
  { value: 'D',     label: 'D    — Metal combustível (classe D)' },
  { value: 'K',     label: 'K    — Cozinha / gordura (classe K)' },
  { value: 'outro', label: 'Outro — digitar manualmente'         },
]

const EXTINTOR_AGENTE_OPTIONS = [
  { value: 'Pó ABC',          label: 'Pó ABC'                            },
  { value: 'Pó BC',           label: 'Pó BC'                             },
  { value: 'CO₂',             label: 'CO₂ (Dióxido de Carbono)'          },
  { value: 'Água',            label: 'Água pressurizada'                 },
  { value: 'Espuma Mecânica', label: 'Espuma Mecânica'                   },
  { value: 'Halotron',        label: 'Halotron'                          },
  { value: 'Agente Limpo',    label: 'Agente Limpo (FM-200, Novec etc.)' },
  { value: 'outro',           label: 'Outro — digitar manualmente'        },
]

const TABS = [
  { key: 'identificacao' as const, label: 'Identificação',   icon: Package },
  { key: 'localizacao'   as const, label: 'Vínculo / Local', icon: MapPin  },
] as const
type TabKey = typeof TABS[number]['key']

function SelectOuOutro({ options, value, valorManual, onChange, onChangeManual, placeholder, placeholderManual }: {
  options: { value: string; label: string }[]
  value: string; valorManual: string
  onChange: (v: string) => void; onChangeManual: (v: string) => void
  placeholder?: string; placeholderManual?: string
}) {
  const base = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all'
  return (
    <div className="space-y-2">
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={cn(base, 'appearance-none pr-8 cursor-pointer')}>
          <option value="">{placeholder ?? 'Selecione...'}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
      </div>
      {value === 'outro' && (
        <input type="text" value={valorManual} onChange={e => onChangeManual(e.target.value)}
          className={cn(base, 'border-dashed border-[#3d6cf0] bg-blue-50/30')}
          placeholder={placeholderManual ?? 'Descreva manualmente...'} autoFocus />
      )}
    </div>
  )
}

// ─── Inner ────────────────────────────────────────────────────────────────────
function EditarInner() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const id = params?.id as string

  const [loading, setLoading]   = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [tab, setTab]           = useState<TabKey>('identificacao')
  const [pontosDisponiveis, setPontosDisponiveis] = useState<any[]>([])

  // ── Campos ──
  const [tipo, setTipo]             = useState('')
  const [tipoManual, setTipoManual] = useState('')
  const [isTipoManual, setIsTipoManual] = useState(false)
  const [nome, setNome]             = useState('')
  const [status, setStatus]         = useState<StatusEquip>('ativo')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [agente, setAgente]         = useState('')
  const [pontoId, setPontoId]       = useState<string | null>(null)

  // ── Extintor ──
  const [extClasse, setExtClasse]             = useState('')
  const [extClasseManual, setExtClasseManual] = useState('')
  const [extCarga, setExtCarga]               = useState('')
  const [extAgente, setExtAgente]             = useState('')
  const [extAgenteManual, setExtAgenteManual] = useState('')
  const [serieInmetro, setSerieInmetro]       = useState('')
  const [serieCilindro, setSerieCilindro]     = useState('')
  const [validadeRecarga, setValidadeRecarga] = useState('')

  const isExtintor = tipo === 'Extintor' && !isTipoManual

  // ── Carrega equipamento ──
  useEffect(() => {
    if (!session || !id) return
    const fetchEquip = async () => {
      setLoading(true)
      try {
        const token = (session as any)?.access_token || (session as any)?.accessToken
        const res = await fetch(`http://localhost:3001/equipamentos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const d = await res.json()

        // Verifica se o tipo é um dos padrões ou manual
        const tipoConhecido = TIPO_OPTIONS.find(t => t.value === d.tipo)
        if (tipoConhecido) { setTipo(d.tipo); setIsTipoManual(false) }
        else { setTipoManual(d.tipo || ''); setIsTipoManual(true) }

        setNome(d.nome || '')
        setStatus((d.status?.toLowerCase() as StatusEquip) || 'ativo')
        setNumeroSerie(d.codigo || '')
        setAgente(d.agente || '')
        setPontoId(d.pontoInstalacao?.id ?? null)

        // Extintor
        setExtClasse(d.extintorClasse || '')
        setExtCarga(d.extintorCarga ? String(d.extintorCarga) : '')
        setExtAgente(d.agente || '')
        setSerieInmetro(d.serieInmetro || '')
        setSerieCilindro(d.serieCilindro || '')
        setValidadeRecarga(d.proximaRecarga ? d.proximaRecarga.split('T')[0] : '')
      } catch {
        alert('Erro ao carregar equipamento.')
        router.push('/equipamentos/lista')
      } finally { setLoading(false) }
    }
    fetchEquip()
  }, [id, session])

  // ── Carrega pontos ──
  const loadPontos = useCallback(async () => {
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return
    try {
      const res  = await fetch('http://localhost:3001/pontos', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setPontosDisponiveis(Array.isArray(data) ? data : (data.data || []))
    } catch { setPontosDisponiveis([]) }
  }, [session])

  useEffect(() => { loadPontos() }, [loadPontos])

  // ── Validação ──
  const codigoFinal = isExtintor ? serieCilindro : numeroSerie

  const extintorValido = !isExtintor || (
    !!(extClasse === 'outro' ? extClasseManual : extClasse) &&
    !!extCarga &&
    !!(extAgente === 'outro' ? extAgenteManual : extAgente)
  )
  const identificacaoValida = isExtintor ? !!serieCilindro : !!numeroSerie

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!(isTipoManual ? tipoManual : tipo) && !!nome && identificacaoValida && extintorValido,
    localizacao:   true,
  }
  const tabOrder: TabKey[] = ['identificacao', 'localizacao']
  const currentIdx = tabOrder.indexOf(tab)
  const allValid   = tabValid.identificacao
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      const token  = (session as any)?.access_token || (session as any)?.accessToken
      const userUf = (session?.user as any)?.uf || 'PI'

      const extintorPayload = isExtintor
        ? {
            extintorClasse: extClasse === 'outro' ? extClasseManual : extClasse,
            extintorCarga:  extCarga,
            agente:         extAgente === 'outro' ? extAgenteManual : extAgente,
            serieInmetro:   serieInmetro  || null,
            serieCilindro:  serieCilindro || null,
            proximaRecarga: validadeRecarga || null,
          }
        : { agente }

      const payload = {
        codigo:  codigoFinal,
        nome:    nome || null,
        tipo:    isTipoManual ? tipoManual : tipo,
        status:  status.toUpperCase(),
        uf:      userUf,
        pontoId: pontoId || null,
        ...extintorPayload,
      }

      const res = await fetch(`http://localhost:3001/equipamentos/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      })

      if (res.status === 401) { alert('Não autorizado.'); router.push('/login'); return }
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erro ao salvar') }

      setSuccessModal(true)
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar alterações.')
    } finally { setIsSaving(false) }
  }

  const inp  = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all'
  const sec  = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const lbl  = 'text-[13.5px] font-medium text-[#111827]'
  const lbl2 = 'text-[11px] text-slate-400 mt-0.5'
  const row  = 'grid gap-4 items-start py-4 grid-cols-1 sm:grid-cols-[220px_1fr]'
  const divi = 'divide-y divide-[#f1f5f9]'

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
    </div>
  )

  return (
    <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <button onClick={() => router.push('/equipamentos/lista')}
            className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
            <ArrowLeft size={14} /> Equipamentos
          </button>
          <span className="text-[11px]">›</span>
          <button onClick={() => router.push(`/equipamentos/detalhes/${id}`)} className="hover:text-[#3d6cf0] font-medium">
            {numeroSerie || id}
          </button>
          <span className="text-[11px]">›</span>
          <span className="text-[#3d6cf0] font-semibold">Editar</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Etapa {currentIdx + 1} de {tabOrder.length}
        </span>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
            tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-bold' : 'text-[#9ca3af] border-transparent'
          )}>
            {t.label}
            {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

        {/* ══ ABA 1 — IDENTIFICAÇÃO ══ */}
        {tab === 'identificacao' && (
          <div className="fade-up space-y-4">

            {/* Seletor de tipo */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Tipo de Equipamento *</div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                  {TIPO_OPTIONS.map(t => {
                    const sel  = tipo === t.value && !isTipoManual
                    const Icon = t.icon
                    return (
                      <button key={t.value} onClick={() => { setTipo(t.value); setIsTipoManual(false) }}
                        className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          sel ? 'border-[#3d6cf0] bg-blue-50/50' : 'border-slate-50 hover:border-slate-200')}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all"
                          style={sel ? { background: t.bg, borderColor: t.border } : { background: '#f8fafc', borderColor: '#e3e8ef' }}>
                          <Icon size={24} style={{ color: sel ? t.color : '#c4cbd6' }} />
                        </div>
                        <span className={cn('text-[10px] font-bold text-center leading-tight', sel ? 'text-[#3d6cf0]' : 'text-[#9ca3af]')}>
                          {t.labelShort}
                        </span>
                      </button>
                    )
                  })}
                  <button onClick={() => { setIsTipoManual(true); setTipo('') }}
                    className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all border-dashed',
                      isTipoManual ? 'border-[#3d6cf0] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300')}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-[#f8fafc] border-[#e3e8ef]">
                      <Plus size={24} className={isTipoManual ? 'text-[#3d6cf0]' : 'text-slate-300'} />
                    </div>
                    <span className={cn('text-[10px] font-bold', isTipoManual ? 'text-[#3d6cf0]' : 'text-slate-400')}>OUTRO</span>
                  </button>
                </div>
                {isTipoManual && (
                  <input className={cn(inp, 'border-dashed border-[#3d6cf0] bg-blue-50/30')}
                    placeholder="Especifique o tipo..." value={tipoManual} onChange={e => setTipoManual(e.target.value)} autoFocus />
                )}
              </div>
            </div>

            {/* Extintor — dados técnicos */}
            {isExtintor && (
              <div className="slide-down bg-white border-2 border-[#bfdbfe] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-3 bg-blue-50 border-b border-[#bfdbfe] flex items-center gap-2">
                  <Flame size={14} className="text-[#1d4ed8]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#1d4ed8]">Dados Técnicos do Extintor</span>
                </div>
                <div className={cn('px-6', divi)}>
                  <div className={row}><div><p className={lbl}>Classe *</p><p className={lbl2}>Tipo de incêndio combatido</p></div>
                    <SelectOuOutro options={EXTINTOR_CLASSE_OPTIONS} value={extClasse} valorManual={extClasseManual}
                      onChange={setExtClasse} onChangeManual={setExtClasseManual} placeholder="Selecione a classe..." placeholderManual="Ex: ABCDK..." />
                  </div>
                  <div className={row}><div><p className={lbl}>Carga *</p><p className={lbl2}>Peso do agente</p></div>
                    <div className="flex items-center gap-2 max-w-[180px]">
                      <input type="number" min="1" step="0.5" value={extCarga} onChange={e => setExtCarga(e.target.value)} className={inp} placeholder="Ex: 6..." />
                      <span className="text-sm font-bold text-slate-500">kg</span>
                    </div>
                  </div>
                  <div className={row}><div><p className={lbl}>Agente *</p><p className={lbl2}>Substância utilizada</p></div>
                    <SelectOuOutro options={EXTINTOR_AGENTE_OPTIONS} value={extAgente} valorManual={extAgenteManual}
                      onChange={setExtAgente} onChangeManual={setExtAgenteManual} placeholder="Selecione o agente..." placeholderManual="Ex: AFFF..." />
                  </div>
                  <div className={row}>
                    <div className="flex items-start gap-2"><CalendarClock size={15} className="text-[#1d4ed8] mt-0.5 flex-shrink-0" /><div><p className={lbl}>Validade da Recarga</p><p className={lbl2}>Próxima recarga obrigatória</p></div></div>
                    <input type="date" value={validadeRecarga} onChange={e => setValidadeRecarga(e.target.value)} className={cn(inp, 'max-w-[200px]')} />
                  </div>
                </div>
              </div>
            )}

            {/* Dados gerais */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Dados Gerais</div>
              <div className={cn('px-6', divi)}>
                <div className={row}><span className={lbl}>Nome / Descrição *</span>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} className={inp}
                    placeholder={isExtintor ? 'Ex: Extintor CO₂ 6kg – Bloco A' : 'Ex: Hidrante – Pavimento 2'} />
                </div>
                <div className={row}><span className={lbl}>Status *</span>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setStatus(opt.value)}
                        className={cn('px-4 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5',
                          status === opt.value ? 'border-[#3d6cf0] bg-blue-50 text-[#3d6cf0]' : 'border-slate-100 text-slate-400')}>
                        <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Identificação / Séries */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Identificação</div>
              <div className={cn('px-6', divi)}>
                {!isExtintor && (
                  <div className={row}>
                    <div className="flex items-start gap-2"><Hash size={15} className="text-slate-400 mt-0.5 flex-shrink-0" /><div><p className={lbl}>Nº de Série / Patrimônio *</p><p className={lbl2}>Número do fabricante / Código de Barras</p></div></div>
                    <input type="text" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} className={inp} placeholder="Ex: AMX-2024-9921" />
                  </div>
                )}
                {isExtintor && (
                  <>
                    <div className={row}>
                      <div className="flex items-start gap-2"><ShieldCheck size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" /><div><p className={lbl}>Nº do Selo INMETRO</p><p className={lbl2}>Número de série do lacre/selo</p></div></div>
                      <input type="text" value={serieInmetro} onChange={e => setSerieInmetro(e.target.value)} className={inp} placeholder="Ex: 0123456789" />
                    </div>
                    <div className={row}>
                      <div className="flex items-start gap-2"><Package size={15} className="text-slate-500 mt-0.5 flex-shrink-0" /><div><p className={lbl}>Nº de Série do Cilindro *</p><p className={lbl2}>Gravado no corpo metálico</p></div></div>
                      <input type="text" value={serieCilindro} onChange={e => setSerieCilindro(e.target.value)} className={inp} placeholder="Ex: CIL-2022-00412" />
                    </div>
                  </>
                )}
                {!isExtintor && (
                  <div className={row}><span className={lbl}>Agente / Especificação</span>
                    <input type="text" value={agente} onChange={e => setAgente(e.target.value)} className={inp} placeholder="Ex: PQS, Água, CO₂, 220V..." />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ABA 2 — VÍNCULO / LOCAL ══ */}
        {tab === 'localizacao' && (
          <div className="fade-up space-y-4">
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Vínculo com Ponto de Instalação</div>
              <div className="p-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
                  <AlertCircle size={20} className="text-blue-500 mt-0.5" />
                  <p className="text-sm text-blue-700">Altere o ponto de instalação ou deixe em branco para manter em estoque.</p>
                </div>
                <div className="grid gap-4 items-center grid-cols-1 sm:grid-cols-[220px_1fr]">
                  <span className={lbl}>Ponto de Instalação</span>
                  <div className="relative">
                    <select className={cn(inp, 'appearance-none pr-8')} value={pontoId || ''} onChange={e => setPontoId(e.target.value || null)}>
                      <option value="">NÃO VINCULAR (EM ESTOQUE)</option>
                      {pontosDisponiveis.map(p => <option key={p.id} value={p.id}>QR: {p.qrCode} - {p.nome}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-1.5">
            {tabOrder.map(key => <div key={key} className={cn('h-1.5 w-6 rounded-full transition-all', tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200')} />)}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etapas: {completedCount}/{tabOrder.length}</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {currentIdx > 0 && (
            <button onClick={() => setTab(tabOrder[currentIdx - 1])} className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500">VOLTAR</button>
          )}
          {currentIdx < tabOrder.length - 1 ? (
            <button onClick={() => setTab(tabOrder[currentIdx + 1])} className="flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white bg-[#3d6cf0]">PRÓXIMO</button>
          ) : (
            <button disabled={!allValid || isSaving} onClick={handleSave}
              className={cn('flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                allValid && !isSaving ? 'bg-[#3d6cf0]' : 'bg-slate-200')}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'SALVAR ALTERAÇÕES'}
            </button>
          )}
        </div>
      </div>

      {/* Modal Sucesso */}
      {successModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-emerald-500" />
            </div>
            <h3 className="font-black text-xl text-slate-800 mb-1">Salvo!</h3>
            <p className="text-slate-500 text-sm mb-8">Alterações salvas com sucesso.</p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/equipamentos/lista')} className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs">LISTAGEM</button>
              <button onClick={() => router.push(`/equipamentos/detalhes/${id}`)} className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs">VER DETALHES</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditarEquipamentoPage() {
  return (
    <DashboardLayout title="Editar Equipamento">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up   { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn   { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in  { animation: scaleIn 0.15s ease forwards; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;} }
        .slide-down { animation: slideDown 0.2s ease forwards; }
      `}} />
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={36} className="animate-spin text-[#3d6cf0]" /></div>}>
        <EditarInner />
      </Suspense>
    </DashboardLayout>
  )
}