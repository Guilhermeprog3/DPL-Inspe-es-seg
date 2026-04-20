'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  User, Tag, AlertTriangle, FileText, Paperclip, CheckCircle, Loader2,
  Search, X, ChevronDown, ArrowLeft, Upload, File, Trash2, FileImage,
  LayoutDashboard, PlusCircle, List, Users, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida    = 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO' | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade     = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | ''

const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard',     href: '/medida-administrativa',       icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida',   href: '/medida-administrativa/nova',  icon: PlusCircle },
  { label: 'Histórico',     href: '/medida-administrativa/lista', icon: List },
  { section: 'Configurações' },
  { label: 'Colaboradores', href: '/colaboradores',               icon: Users },
]

const CLASSIFICACOES = [
  "ADMNISTRATIVA","NÃO CONFORMIDADE GRAVE EM PROCEDIMENTOS DE SEGURANÇA DURANTE A ATIVIDADE","VELOCIDADE","PAPEL DE GUARDIÃO","CELULAR","REINTEGRA","CÂMERA","LUVA/MANGA ISOLANTE/PROTETOR FACIAL","OBSTRUÇÃO DE CÂMERA","REGRAS DE OURO","LUVAS DE VAQUETA/ VISEIRA/ BALACLAVA","EPI / EPI'S","CAMISA POR FORA DA CALÇA/ PERNEIRAS/ÓCULOS DE PROTEÇÃO/CINTO PARAQUEDITAS/CAPACETE/SINALIZAÇÃO","CINTO DE SEGURANÇA","SINALIZAÇÃO/PR","SONOLÊNCIA","PROTETOR FACIAL/SEM SINALIZAÇÃO/ SEM GUARDIÃO","EXCESSO DE VELOCIDADE","MANTAS ISOLANTES","VELOCIDADE/ OBSTRUÇÃO","ATERRAMENTO TEMPORÁRIO BT","MANOBRA DE RÉ / MANOBRA MARCHA RÉ","COLABORADOR NÃO SE APRESENTOU NO SOBREAVISO","BALACLAVA/LUVA ISOLANTE/LUVA DE COBERTURA/VESTIMENTA RF","VELOCIDADE/ CELULAR","CABO DE MT PARTIDO","FOLHA DE PONTO","CAPACETE","APR","NÃO UTILIZOU EPI ADEQUADO","PROTETOR FACIAL","NÃO COMUNICOU ACIDENTE DE TRABALHO","BALACLAVA/PROTETOR FACIAL/SINALIZAÇÃO","NOTA COMERCIAL ENCERRADA DE FORMA INCORRETA","LUVA CLASSE 0","LENÇOL ISOLANTE/ BALACLAVA/ MANGA ISOLANTE/ SINALIZAÇÃO","PNEUS","ESCADA/ MANGAS ISOLANTES/LENÇÓIS ISOLANTES/CINTO PARAQUEDITA","FALTA DE SINALIZAÇÃO NO LOCAL DE SERVIÇO","RECUSOU SE DESLOCAR PARA OUTRA CIDADE (SOLITAÇÃO DO SUPERVISOR DE CAMPO)","ERRO DE PROCEDIMENTO OPERACIONAL","TRANSITAR EM VIA PÚBLICA PELA CONTRA MÃO","BANDEIROLA","ESCADA/TRAVA QUEDAS","PROTETOR FACIAL(VISEIRA)","ESCADA","AUSÊNCIA SEM JUSTIFICATIVA NA REC DE NR35","LUVA ISOLANTE/ LUVA DE COBERTURA/VESTIMENTA RF","DESCUPRIMENTO DAS LEIS DE TRÂNSITO","DELIMITAÇÃO DA AREA/EPI","CELULAR/EXCESSO DE VELOCIDADE","FREIO ABS/TRAVA QUEDA","CIGARRO / FUMANDO","DESCUMPRIMENTO DE PROCEDIMENTO CRÍTICO DE SEGURANÇA","FALHA DE PROCEDIMENTO / ATO INSEGURO","LINHA VIVA","EPC/PROCEDIMENTO DE SEGURANÇA","SEM SINALIZAÇÃO DA AREA/PAPEL DE GUARDIÃO","DIREÇÃO DISTRAÍDA","NEGLIGÊNCIA DURANTE A ATIVIDADE","ATO INSEGURO","AUTOINSPECÇÃO DIÁRIA","SEM O USO DO CINTO DE SEGURANÇA","OBSTRUÇÃO CÂMERA","ATERRAMENTO","COLABORADOR ESTAVA COCHILANDO AO VOLANTE",
  "OUTROS" // ← novo
]

const ORIGENS = ['ESS', 'CLICK', 'NMC', 'MULTA DE TRÂNSITO', 'GESTÃO DE GENTE']

const GRAVIDADE_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  LEVE:       { color: '#10b981', bg: '#f0fdf4', border: '#10b981', label: 'Ocorrência de baixo impacto' },
  MÉDIA:      { color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b', label: 'Requer atenção e acompanhamento' },
  GRAVE:      { color: '#ef4444', bg: '#fef2f2', border: '#ef4444', label: 'Impacto significativo na segurança' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#a855f7', label: 'Risco crítico — ação imediata' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação',    icon: User },
  { key: 'classificacao', label: 'Classificação',    icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',        icon: AlertTriangle },
  { key: 'ocorrencia',   label: 'Ocorrência',       icon: FileText },
  { key: 'anexos',       label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']
type Anexo  = { id: string; file: File; preview?: string }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle size={12} className="text-red-500 shrink-0" />
      <span className="text-[11px] text-red-500 font-medium">{message}</span>
    </div>
  )
}

function AbsoluteDropdown({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="slide-down absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
      {children}
    </div>
  )
}

export default function NovaMedidaPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [tab,             setTab            ] = useState<TabKey>('identificacao')
  const [successModal,    setSuccessModal   ] = useState(false)
  const [isRegistering,   setIsRegistering  ] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nomeColab,      setNomeColab     ] = useState('')
  const [matriculaColab, setMatriculaColab] = useState('')
  const [matriculaSup,   setMatriculaSup  ] = useState('')
  const [nomeSupervisor, setNomeSupervisor] = useState('')
  const [dataMedida,     setDataMedida    ] = useState('')
  const [tipoCategoria,  setTipoCategoria ] = useState<TipoCategoria>('')
  const [tipoMedida,     setTipoMedida    ] = useState<TipoMedida>('')
  const [diasSuspensao,  setDiasSuspensao ] = useState('')
  const [gravidade,      setGravidade     ] = useState<Gravidade>('')
  const [classificacao,  setClassificacao ] = useState('')
  const [ocorrencia,     setOcorrencia    ] = useState('')
  const [relacionarClick,setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao] = useState('')
  const [origem,         setOrigem        ] = useState('') // ← novo

  const [nomeColabError,      setNomeColabError     ] = useState('')
  const [nomeSuperError,      setNomeSuperError     ] = useState('')
  const [matriculaColabError, setMatriculaColabError] = useState('')
  const [matriculaSupError,   setMatriculaSupError  ] = useState('')

  const [showColabDropdown,     setShowColabDropdown    ] = useState(false)
  const [showMatriculaDropdown, setShowMatriculaDropdown] = useState(false)
  const [showClassifDropdown,   setShowClassifDropdown  ] = useState(false)

  const [colaboradoresRepo, setColaboradoresRepo] = useState<any[]>([])
  const [searchQuery,       setSearchQuery       ] = useState('')
  const [anexos,            setAnexos            ] = useState<Anexo[]>([])
  const [isDragging,        setIsDragging        ] = useState(false)

  useEffect(() => {
    if (!session) return
    api.get('/taxa-contato/recentes').then(r => setColaboradoresRepo(r.data)).catch(console.error)
  }, [session])

  const colabsFiltrados = useMemo(() => {
    const t = nomeColab.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo.filter(c => String(c.NOME || '').toLowerCase().includes(t)).slice(0, 8)
  }, [nomeColab, colaboradoresRepo])

  const chapasFiltradas = useMemo(() => {
    const t = matriculaColab.trim()
    if (!t) return []
    return colaboradoresRepo.filter(c => String(c.CHAPA || '').includes(t)).slice(0, 8)
  }, [matriculaColab, colaboradoresRepo])

  const filteredClassificacoes = useMemo(() =>
    searchQuery ? CLASSIFICACOES.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase())) : CLASSIFICACOES
  , [searchQuery])

  function selecionarColab(item: any) {
    setNomeColab(String(item.NOME || ''))
    setMatriculaColab(String(item.CHAPA || ''))
    setNomeSupervisor(String(item.SUPERVISOR || ''))
    setNomeColabError(''); setMatriculaColabError('')
    setShowColabDropdown(false); setShowMatriculaDropdown(false)
  }

  function handleNomeColabChange(val: string) {
    if (/\d/.test(val)) { setNomeColabError('O nome não pode conter números'); return }
    setNomeColabError(''); setNomeColab(val); setShowColabDropdown(true)
  }
  function handleNomeSuperChange(val: string) {
    if (/\d/.test(val)) { setNomeSuperError('O nome não pode conter números'); return }
    setNomeSuperError(''); setNomeSupervisor(val)
  }
  function handleMatriculaColabChange(val: string) {
    if (val && /[^0-9]/.test(val)) { setMatriculaColabError('Apenas números permitidos'); return }
    setMatriculaColabError(''); setMatriculaColab(val); setShowMatriculaDropdown(true)
  }
  function handleMatriculaSupChange(val: string) {
    if (val && /[^0-9]/.test(val)) { setMatriculaSupError('Apenas números permitidos'); return }
    setMatriculaSupError(''); setMatriculaSup(val)
  }

  function handleFilesAdd(files: FileList | null) {
    if (!files) return
    setAnexos(prev => [...prev, ...Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2), file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))])
  }
  function removerAnexo(id: string) {
    setAnexos(prev => { const a = prev.find(x => x.id === id); if (a?.preview) URL.revokeObjectURL(a.preview); return prev.filter(x => x.id !== id) })
  }
  const fmt = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(1)} MB`
  const fileIcon = (f: File) => f.type.startsWith('image/') ? <FileImage size={20} className="text-blue-400" /> : f.type === 'application/pdf' ? <FileText size={20} className="text-red-400" /> : <File size={20} className="text-slate-400" />
  useEffect(() => () => anexos.forEach(a => a.preview && URL.revokeObjectURL(a.preview)), [])

  async function handleRegister() {
    if (isRegistering || !allValid) return
    setIsRegistering(true)
    const fd = new FormData()
    Object.entries({
      colaborador: nomeColab, matricula: matriculaColab, supervisor: matriculaSup,
      nomeSupervisor, tipo: tipoCategoria, medida: tipoMedida, ocorrencia,
      gravidade, classificacao, origem, data: new Date(dataMedida).toISOString()
    }).forEach(([k, v]) => fd.append(k, v))
    if (diasSuspensao) fd.append('diasSuspensao', diasSuspensao)
    if (relacionarClick && numeroInspecao) fd.append('numeroInspecao', numeroInspecao)
    anexos.forEach(a => fd.append('files', a.file))
    try { await api.post('/medidas', fd); setAnexos([]); setSuccessModal(true) }
    catch (e: any) { alert(e.response?.data?.message || 'Erro ao registrar.') }
    finally { setIsRegistering(false) }
  }

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nomeColab && !nomeColabError && !!matriculaColab && !matriculaColabError && !!nomeSupervisor && !nomeSuperError && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade:     true,
    ocorrencia:    !!classificacao && ocorrencia.trim().length >= 10,
    anexos:        !!origem && (!relacionarClick || !!numeroInspecao.trim()), // ← origem obrigatória
  }

  const tabOrder: TabKey[] = ['identificacao','classificacao','gravidade','ocorrencia','anexos']
  const currentIdx     = tabOrder.indexOf(tab)
  const allValid       = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length
  const goNext = () => currentIdx < 4 ? setTab(tabOrder[currentIdx + 1]) : handleRegister()
  const goPrev = () => { if (currentIdx > 0) setTab(tabOrder[currentIdx - 1]) }

  const inputCls = (err?: boolean) => cn(
    'w-full bg-[#f8fafc] border rounded-lg h-10 px-3 text-[13.5px] outline-none transition-all',
    err ? 'border-red-300 bg-red-50/30 focus:border-red-400' : 'border-[#e3e8ef] focus:border-[#3d6cf0] focus:bg-white'
  )
  const secTitle = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls = 'text-[13.5px] font-medium text-[#111827]'

  return (
    <DashboardLayout title="Nova Medida" navItems={navItems} onSidebarChange={setSidebarExpanded}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:none} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(0.95)}      to{opacity:1;transform:scale(1)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
        .fade-up   { animation: fadeUp    0.2s  ease forwards }
        .scale-in  { animation: scaleIn   0.15s ease forwards }
        .slide-down{ animation: slideDown 0.15s ease forwards }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* Breadcrumb + Tabs */}
        <div className="bg-white" style={{ borderBottom: '1px solid #e3e8ef', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="px-7 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0f2f5' }}>
            <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
              <button onClick={() => router.push('/medida-administrativa/lista')} className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
                <ArrowLeft size={14} /> Medidas
              </button>
              <span className="text-[11px]">›</span>
              <span className="text-[#3d6cf0] font-semibold">Nova Medida</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa {currentIdx + 1} de 5</span>
          </div>
          <div className="px-7 flex overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-2 whitespace-nowrap transition-all',
                  tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold' : 'text-[#9ca3af] border-transparent hover:text-slate-600')}>
                {t.label}
                {tabValid[t.key] && t.key !== 'gravidade' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-28">

          {/* IDENTIFICAÇÃO */}
          {tab === 'identificacao' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm" style={{ overflow: 'visible' }}>
                <div className={secTitle} style={{ borderRadius: '0.75rem 0.75rem 0 0' }}>Dados do Colaborador (Taxa de Contato)</div>

                <div className="grid gap-x-4 gap-y-1 items-start px-6 py-4 border-b border-[#e3e8ef]"
                     style={{ gridTemplateColumns: '180px 1fr 1fr', overflow: 'visible' }}>
                  <span className={cn(labelCls, 'mt-2')}>Nomes *</span>
                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <input type="text" value={nomeColab} placeholder="Pesquisar nome..."
                      className={inputCls(!!nomeColabError)}
                      onChange={e => handleNomeColabChange(e.target.value)}
                      onFocus={() => setShowColabDropdown(true)}
                      onBlur={() => setTimeout(() => setShowColabDropdown(false), 200)} />
                    <FieldError message={nomeColabError} />
                    <AbsoluteDropdown open={showColabDropdown && colabsFiltrados.length > 0}>
                      {colabsFiltrados.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 transition-colors"
                             onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700">{c.NOME}</p>
                          <p className="text-slate-400">Chapa: {c.CHAPA}</p>
                        </div>
                      ))}
                    </AbsoluteDropdown>
                  </div>
                  <div>
                    <input type="text" value={nomeSupervisor} placeholder="Supervisor"
                      className={inputCls(!!nomeSuperError)} onChange={e => handleNomeSuperChange(e.target.value)} />
                    <FieldError message={nomeSuperError} />
                  </div>
                </div>

                <div className="grid gap-x-4 gap-y-1 items-start px-6 py-4 border-b border-[#e3e8ef]"
                     style={{ gridTemplateColumns: '180px 1fr 1fr', overflow: 'visible' }}>
                  <span className={cn(labelCls, 'mt-2')}>Matrículas *</span>
                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <input type="text" inputMode="numeric" value={matriculaColab}
                      placeholder="Mat. Colab (apenas números)"
                      className={inputCls(!!matriculaColabError)}
                      onChange={e => handleMatriculaColabChange(e.target.value)}
                      onFocus={() => setShowMatriculaDropdown(true)}
                      onBlur={() => setTimeout(() => setShowMatriculaDropdown(false), 200)} />
                    <FieldError message={matriculaColabError} />
                    <AbsoluteDropdown open={showMatriculaDropdown && chapasFiltradas.length > 0}>
                      {chapasFiltradas.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 transition-colors"
                             onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700">{c.CHAPA}</p>
                          <p className="text-slate-400">{c.NOME}</p>
                        </div>
                      ))}
                    </AbsoluteDropdown>
                  </div>
                  <div>
                    <input type="text" inputMode="numeric" value={matriculaSup}
                      placeholder="Mat. Sup (apenas números)"
                      className={inputCls(!!matriculaSupError)} onChange={e => handleMatriculaSupChange(e.target.value)} />
                    <FieldError message={matriculaSupError} />
                  </div>
                </div>

                <div className="grid gap-4 items-center px-6 py-4" style={{ gridTemplateColumns: '180px auto' }}>
                  <span className={labelCls}>Data *</span>
                  <input type="date" value={dataMedida} onChange={e => setDataMedida(e.target.value)}
                    className={cn(inputCls(), 'w-[200px]')} />
                </div>
              </div>
            </div>
          )}

          {/* CLASSIFICAÇÃO */}
          {tab === 'classificacao' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>Categoria e Tipo</div>
                <div className="p-6 flex gap-3">
                  {(['SEGURANÇA','ADMINISTRATIVA'] as const).map(cat => (
                    <button key={cat} onClick={() => setTipoCategoria(cat)}
                      className={cn('flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all',
                        tipoCategoria === cat ? 'bg-[#3d6cf0] border-[#3d6cf0] text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="p-6 pt-0 space-y-2">
                  {(['ADVERTÊNCIA VERBAL','ADVERTÊNCIA ESCRITA','SUSPENSÃO','CONVERSA PEDAGÓGICA','TREINAMENTO'] as const).map(m => (
                    <div key={m} onClick={() => setTipoMedida(m)}
                      className={cn('p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all',
                        tipoMedida === m ? 'border-[#3d6cf0] bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50')}>
                      <span className="text-sm font-semibold text-slate-700">{m}</span>
                      {tipoMedida === m && <CheckCircle size={18} className="text-[#3d6cf0]" />}
                    </div>
                  ))}
                </div>
                {tipoMedida === 'SUSPENSÃO' && (
                  <div className="p-6 border-t bg-slate-50/30 flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dias *</span>
                    <input type="number" value={diasSuspensao} onChange={e => setDiasSuspensao(e.target.value)} className={cn(inputCls(), 'max-w-[120px]')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRAVIDADE */}
          {tab === 'gravidade' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>
                  Nível de Gravidade
                  <span className="ml-2 text-[10px] font-normal normal-case text-slate-400">(opcional)</span>
                </div>
                <div className="p-4 space-y-2">
                  {Object.entries(GRAVIDADE_CFG).map(([g, cfg]) => (
                    <div key={g} onClick={() => setGravidade(gravidade === g ? '' : g as Gravidade)}
                      className={cn('p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all group',
                        gravidade === g ? 'shadow-sm' : 'border-transparent bg-slate-50/60 hover:bg-slate-100/60')}
                      style={gravidade === g ? { borderColor: cfg.border, backgroundColor: cfg.bg } : {}}>
                      <div className="w-3 h-3 rounded-full shrink-0 transition-transform group-hover:scale-110" style={{ background: cfg.color }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{g}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{cfg.label}</p>
                      </div>
                      {gravidade === g && <CheckCircle size={18} style={{ color: cfg.color }} />}
                    </div>
                  ))}
                </div>
                {gravidade && (
                  <div className="px-6 pb-4">
                    <button onClick={() => setGravidade('')} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
                      Limpar seleção
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OCORRÊNCIA */}
          {tab === 'ocorrencia' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm" style={{ overflow: 'visible' }}>
                <div className={secTitle} style={{ borderRadius: '0.75rem 0.75rem 0 0' }}>Detalhes da Ocorrência</div>
                <div className="p-6 space-y-6" style={{ overflow: 'visible' }}>
                  <div>
                    <label className="text-[12px] font-bold text-slate-500 uppercase mb-1.5 block">Classificação *</label>
                    <div style={{ position: 'relative', overflow: 'visible' }}>
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input type="text" className={cn(inputCls(), 'pl-10 pr-10 h-11')}
                        placeholder="Busque e selecione um motivo..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) setClassificacao(''); setShowClassifDropdown(true) }}
                        onFocus={() => setShowClassifDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClassifDropdown(false), 200)} />
                      {searchQuery && (
                        <button type="button" onClick={() => { setSearchQuery(''); setClassificacao('') }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                      <AbsoluteDropdown open={showClassifDropdown}>
                        {filteredClassificacoes.length > 0
                          ? filteredClassificacoes.map((item, i) => (
                              <button key={i} type="button"
                                onMouseDown={() => { setClassificacao(item); setSearchQuery(item); setShowClassifDropdown(false) }}
                                className={cn('w-full text-left px-4 py-3 text-[12.5px] font-medium border-b border-slate-50 last:border-0 transition-colors',
                                  classificacao === item ? 'bg-blue-50 text-[#3d6cf0] font-semibold' : 'text-slate-600 hover:bg-slate-50')}>
                                {item}
                              </button>
                            ))
                          : <div className="p-6 text-center text-slate-400 text-xs">Nenhum resultado</div>
                        }
                      </AbsoluteDropdown>
                    </div>
                    {classificacao && searchQuery === classificacao
                      ? <div className="flex items-center gap-1.5 mt-1.5"><CheckCircle size={12} className="text-emerald-500" /><span className="text-[11px] text-emerald-600 font-medium">Classificação selecionada</span></div>
                      : searchQuery && searchQuery !== classificacao
                        ? <FieldError message="Selecione uma opção da lista" />
                        : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase block">
                      Descrição * <span className="font-normal normal-case text-slate-400">(mín. 10 caracteres)</span>
                    </label>
                    <textarea value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} rows={6}
                      className={cn('w-full bg-[#f8fafc] border rounded-lg px-3 py-3 text-[13.5px] outline-none transition-all resize-none',
                        ocorrencia.length > 0 && ocorrencia.trim().length < 10 ? 'border-red-300 focus:border-red-400' : 'border-[#e3e8ef] focus:border-[#3d6cf0] focus:bg-white')}
                      placeholder="Descreva o que aconteceu..." />
                    <div className="flex items-center justify-between">
                      {ocorrencia.length > 0 && ocorrencia.trim().length < 10 && <FieldError message={`Faltam ${10 - ocorrencia.trim().length} caracteres`} />}
                      <span className={cn('text-[11px] ml-auto', ocorrencia.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400')}>{ocorrencia.length} caracteres</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANEXOS */}
          {tab === 'anexos' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">

                {/* Upload */}
                <div className={secTitle}>Anexos</div>
                <div className="p-6 border-b border-[#e3e8ef]">
                  <div className={cn('border-2 border-dashed rounded-2xl transition-all cursor-pointer',
                    isDragging ? 'border-[#3d6cf0] bg-[#eff4ff]' : 'border-slate-200 bg-slate-50/50 hover:border-[#3d6cf0] hover:bg-blue-50/20')}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFilesAdd(e.dataTransfer.files) }}>
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center select-none">
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border transition-all',
                        isDragging ? 'bg-blue-100 border-blue-300 text-[#3d6cf0]' : 'bg-white border-slate-200 text-slate-400')}>
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Arraste ou <span className="text-[#3d6cf0]">clique para selecionar</span></p>
                      <p className="text-[11px] text-slate-400">Imagens e PDFs aceitos</p>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={e => handleFilesAdd(e.target.files)} />
                </div>

                {/* Lista de anexos */}
                {anexos.length > 0 && (
                  <div className="px-6 py-4 space-y-2 border-b border-[#e3e8ef]">
                    {anexos.map(a => (
                      <div key={a.id} className="scale-in flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">{fileIcon(a.file)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-700 truncate">{a.file.name}</p>
                          <p className="text-[11px] text-slate-400">{fmt(a.file.size)}</p>
                        </div>
                        <button onClick={() => removerAnexo(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── ORIGEM — novo campo ── */}
                <div className={secTitle}>
                  Origem *
                </div>
                <div className="px-6 py-5 border-b border-[#e3e8ef]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORIGENS.map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOrigem(origem === op ? '' : op)}
                        className={cn(
                          'py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all text-left relative',
                          origem === op
                            ? 'bg-[#3d6cf0] border-[#3d6cf0] text-white shadow-sm'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-[#3d6cf0]/30 hover:bg-blue-50/30'
                        )}
                      >
                        {op}
                        {origem === op && (
                          <CheckCircle size={13} className="absolute top-2 right-2 text-white/80" />
                        )}
                      </button>
                    ))}
                  </div>
                  {!origem && (
                    <p className="text-[11px] text-slate-400 mt-2">Selecione a origem da medida</p>
                  )}
                </div>

                {/* Vínculo Externo */}
                <div className={secTitle}>Vínculo Externo</div>
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={labelCls}>Inspeção CLICK</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vincular a uma inspeção existente</p>
                    </div>
                    <button onClick={() => { setRelacionarClick(v => !v); if (relacionarClick) setNumeroInspecao('') }}
                      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0', relacionarClick ? 'bg-[#3d6cf0]' : 'bg-slate-200')}>
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm', relacionarClick ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  {relacionarClick && (
                    <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)} className={inputCls()} placeholder="Número da inspeção" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#e3e8ef] px-8 py-4 flex items-center justify-between z-40"
          style={{ left: sidebarExpanded ? 240 : 0, transition: 'left 300ms ease-in-out' }}>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {tabOrder.map((key, idx) => (
                <div key={key} className={cn('h-1.5 rounded-full transition-all',
                  idx < currentIdx ? 'w-6 bg-[#3d6cf0]' : idx === currentIdx ? 'w-8 bg-[#3d6cf0]' : 'w-6 bg-slate-200')} />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Etapas: {completedCount}/5</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {currentIdx > 0 && (
              <button onClick={goPrev} className="flex-1 md:flex-none px-6 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-300 transition-all">
                VOLTAR
              </button>
            )}
            <button disabled={currentIdx === 4 ? (!allValid || isRegistering) : false} onClick={goNext}
              className={cn('flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all',
                (currentIdx < 4 || allValid) && !isRegistering ? 'bg-[#3d6cf0] hover:bg-[#2f5cd9] shadow-sm' : 'bg-slate-200 cursor-not-allowed text-slate-400')}>
              {isRegistering ? <Loader2 className="animate-spin mx-auto" size={16} /> : currentIdx < 4 ? 'PRÓXIMO' : 'SALVAR REGISTRO'}
            </button>
          </div>
        </div>

        {/* Modal Sucesso */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Sucesso!</h3>
              <p className="text-slate-500 text-sm mb-8">A medida foi registrada com sucesso.</p>
              <button onClick={() => router.push('/medida-administrativa/lista')} className="w-full py-4 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs tracking-widest hover:bg-[#2f5cd9] transition-colors">
                VER LISTAGEM
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}