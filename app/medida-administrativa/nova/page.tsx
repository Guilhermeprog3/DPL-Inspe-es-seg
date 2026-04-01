'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, Loader2, Zap,
  Search, X, ChevronDown, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos e Configurações ──────────────────────────────────────────────────
type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida =
  | 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO'
  | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | ''

const CLASSIFICACOES = [
  { group: "Segurança & EPI", items: ["Uso inadequado de EPI", "Falta de EPI", "NÃO UTILIZOU EPI ADEQUADO", "LUVA/MANGA ISOLANTE/PROTETOR FACIAL", "LUVAS DE VAQUETA/ VISEIRA/ BALACLAVA", "LUVA CLASSE 0", "LENÇOL ISOLANTE", "VESTIMENTA RF", "CAPACETE", "PERNEIRAS", "ÓCULOS DE PROTEÇÃO", "CINTO PARAQUEDITAS", "MANTAS ISOLANTES", "TRAVA QUEDAS"] },
  { group: "Trânsito & Condução", items: ["EXCESSO DE VELOCIDADE", "VELOCIDADE", "MANOBRA DE RÉ / MARCHA RÉ", "DIREÇÃO DISTRAÍDA", "DESCUPRIMENTO DAS LEIS DE TRÂNSITO", "TRANSITAR PELA CONTRA MÃO", "USO DO CELULAR DURANTE CONDUÇÃO", "SONOLÊNCIA", "COCHILANDO AO VOLANTE", "SEM O USO DO CINTO DE SEGURANÇA", "AVARIA VEICULAR"] },
  { group: "Procedimentos (APR/NR)", items: ["NÃO CONFORMIDADE GRAVE EM PROCEDIMENTOS", "APR PREENCHIDA INCORRETAMENTE", "DESCUMPRIMENTO DE NR", "FALHA DE PROCEDIMENTO / ATO INSEGURO", "DESCUMPRIMENTO DE PROCEDIMENTO CRÍTICO", "EXECUÇÃO DA TAREFA SEM SINALIZAÇÃO", "SEM GUARDIÃO DA VIDA", "NÃO COMUNICOU ACIDENTE DE TRABALHO"] },
  { group: "Administrativo & Conduta", items: ["ADMNISTRATIVA", "AUSÊNCIA SEM JUSTIFICATIVA", "FOLHA DE PONTO", "DESVIO DE CONDUTA", "RECUSA EM CUMPRIR ORDENS", "INSUBORDINAÇÃO", "CIGARRO / FUMANDO", "Dano ao patrimônio", "Conduta inadequada com colegas"] },
  { group: "Câmera & Monitoramento", items: ["OBSTRUÇÃO DE CÂMERA", "CÂMERA OBSTRUIDA", "POSSIVEL USO DO CELULAR"] }
]

const GRAVIDADE_CFG: Record<string, { color: string }> = {
  LEVE: { color: '#10b981' },
  MÉDIA: { color: '#f59e0b' },
  GRAVE: { color: '#ef4444' },
  GRAVÍSSIMA: { color: '#a855f7' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação', icon: User },
  { key: 'classificacao', label: 'Classificação', icon: Tag },
  { key: 'gravidade', label: 'Gravidade', icon: AlertTriangle },
  { key: 'ocorrencia', label: 'Ocorrência', icon: FileText },
  { key: 'anexos', label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

export default function NovaMedidaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [successModal, setSuccessModal] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Estados Form
  const [nomeColab, setNomeColab] = useState('')
  const [matriculaColab, setMatriculaColab] = useState('')
  const [statusColab, setStatusColab] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [matriculaSup, setMatriculaSup] = useState('')
  const [statusSup, setStatusSup] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [dataMedida, setDataMedida] = useState('')
  const [tipoCategoria, setTipoCategoria] = useState<TipoCategoria>('')
  const [tipoMedida, setTipoMedida] = useState<TipoMedida>('')
  const [diasSuspensao, setDiasSuspensao] = useState('')
  const [gravidade, setGravidade] = useState<Gravidade>('')
  const [classificacao, setClassificacao] = useState('')
  const [ocorrencia, setOcorrencia] = useState('')
  const [relacionarClick, setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao] = useState('')

  // Estados Pesquisa
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const allFlattenedClasses = useMemo(() => CLASSIFICACOES.flatMap(group => group.items), [])
  const filteredClassificacoes = useMemo(() => {
    if (!searchQuery) return allFlattenedClasses
    return allFlattenedClasses.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, allFlattenedClasses])

  async function handleRegister() {
    if (isRegistering || !allValid) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return
    setIsRegistering(true)
    const payload = {
      colaborador: nomeColab, matricula: matriculaColab, supervisor: matriculaSup,
      tipo: tipoCategoria, medida: tipoMedida, ocorrencia, gravidade, classificacao,
      data: new Date(dataMedida).toISOString(),
      diasSuspensao: diasSuspensao ? Number(diasSuspensao) : null,
      numeroInspecao: relacionarClick ? numeroInspecao : null
    }
    try {
      const res = await fetch('http://localhost:3001/medidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erro ao registrar')
      setSuccessModal(true)
    } catch (error: any) { alert(error.message) } finally { setIsRegistering(false) }
  }

  const validar = (val: string, set: any) => {
    if (val.length < 4) { set('idle'); return }
    set('loading'); setTimeout(() => set('valid'), 600)
  }

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nomeColab && statusColab === 'valid' && statusSup === 'valid' && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade: !!gravidade,
    ocorrencia: !!classificacao && ocorrencia.trim().length >= 10,
    anexos: !relacionarClick || !!numeroInspecao.trim(),
  }

  const tabOrder: TabKey[] = ['identificacao', 'classificacao', 'gravidade', 'ocorrencia', 'anexos']
  const currentIdx = tabOrder.indexOf(tab)
  const allValid = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  const inputCls = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls = 'text-[13.5px] font-medium text-[#111827]'

  return (
    <MedidaLayout title="Nova Medida">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">
        
        {/* ── BREADCRUMB COM BOTÃO VOLTAR ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/medida-administrativa/lista')} className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
              <ArrowLeft size={14} /> Medidas
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Nova Medida</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa {currentIdx + 1} de 5</span>
        </div>

        {/* Tabs Bar */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px', 
              tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold' : 'text-[#9ca3af] border-transparent')}>
              {t.label}
              {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">
          {tab === 'identificacao' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
              <div className={sectionTitleCls}>Dados do Colaborador</div>
              <div className="grid gap-4 items-center px-6 py-4 border-b border-[#e3e8ef] grid-cols-1 sm:grid-cols-[200px_1fr]">
                <span className={labelCls}>Nome Completo *</span>
                <input type="text" value={nomeColab} onChange={e => setNomeColab(e.target.value)} className={inputCls} placeholder="Nome completo" />
              </div>
              <div className="grid gap-4 items-center px-6 py-4 border-b border-[#e3e8ef] grid-cols-1 sm:grid-cols-[200px_1fr_1fr]">
                <span className={labelCls}>Matrículas *</span>
                <input type="text" value={matriculaColab} onChange={e => { setMatriculaColab(e.target.value); validar(e.target.value, setStatusColab) }} className={inputCls} placeholder="Mat. Colaborador" />
                <input type="text" value={matriculaSup} onChange={e => { setMatriculaSup(e.target.value); validar(e.target.value, setStatusSup) }} className={inputCls} placeholder="Mat. Supervisor" />
              </div>
              <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                <span className={labelCls}>Data da Medida *</span>
                <input type="date" value={dataMedida} onChange={e => setDataMedida(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
              </div>
            </div>
          )}

          {tab === 'classificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={sectionTitleCls}>Categoria e Tipo</div>
                <div className="p-6 flex gap-3">
                  {['SEGURANÇA', 'ADMINISTRATIVA'].map(cat => (
                    <button key={cat} onClick={() => setTipoCategoria(cat as any)} 
                      className={cn('flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all', 
                      tipoCategoria === cat ? 'bg-[#3d6cf0] border-[#3d6cf0] text-white' : 'bg-white border-slate-100 text-slate-400')}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="p-6 pt-0 space-y-2">
                  {['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'].map(m => (
                    <div key={m} onClick={() => setTipoMedida(m as any)} 
                      className={cn('p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all', 
                      tipoMedida === m ? 'border-[#3d6cf0] bg-blue-50/50' : 'border-slate-50 hover:border-slate-100')}>
                      <span className="text-sm font-semibold text-slate-700">{m}</span>
                      {tipoMedida === m && <CheckCircle size={18} className="text-[#3d6cf0]" />}
                    </div>
                  ))}
                </div>
                {tipoMedida === 'SUSPENSÃO' && (
                  <div className="p-6 border-t bg-slate-50/30 flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dias de Suspensão *</span>
                    <input type="number" value={diasSuspensao} onChange={e => setDiasSuspensao(e.target.value)} className={cn(inputCls, 'max-w-[120px]')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'gravidade' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
              <div className={sectionTitleCls}>Nível de Gravidade</div>
              <div className="p-6 space-y-3">
                {Object.keys(GRAVIDADE_CFG).map(g => (
                  <div key={g} onClick={() => setGravidade(g as any)} 
                    className={cn('p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all', 
                    gravidade === g ? 'border-[#3d6cf0] bg-blue-50/30' : 'border-slate-50 hover:border-slate-100')}>
                    <div className="w-3 h-3 rounded-full" style={{ background: GRAVIDADE_CFG[g].color }} />
                    <span className="text-sm font-bold text-slate-700">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ocorrencia' && (
            <div className="fade-up bg-white p-8 rounded-3xl border border-[#eef1f6] shadow-sm space-y-6">
              <div className="relative">
                <label className="text-[12px] font-bold text-slate-500 uppercase mb-1.5 block">Pesquisar Classificação *</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3d6cf0]" size={18} />
                  <input type="text" className={cn(inputCls, "pl-12 h-11")} placeholder="Busque por EPI, velocidade..." value={searchQuery} onFocus={() => setShowDropdown(true)}
                    onChange={(e) => { const val = e.target.value; setSearchQuery(val); if (val === '') setClassificacao(''); setShowDropdown(true) }} />
                  {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(''); setClassificacao(''); }} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={14} /></button>
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto p-2">
                      {filteredClassificacoes.length > 0 ? filteredClassificacoes.map((item, i) => (
                        <button key={i} type="button" onClick={() => { setClassificacao(item); setSearchQuery(item); setShowDropdown(false) }} 
                          className={cn("w-full text-left px-4 py-3 text-[13px] font-semibold rounded-xl transition-all mb-1 last:mb-0", 
                          classificacao === item ? "bg-blue-50 text-[#3d6cf0]" : "text-slate-600 hover:bg-slate-50")}>{item}</button>
                      )) : <div className="p-4 text-center text-slate-400 text-xs">Nenhum resultado para "{searchQuery}"</div>}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição Detalhada *</label>
                <textarea value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} rows={6} className={cn(inputCls, 'h-auto py-3 leading-relaxed')} placeholder="Descreva detalhadamente o que aconteceu..." />
              </div>
            </div>
          )}

          {tab === 'anexos' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
              <div className={sectionTitleCls}>Vínculo Externo</div>
              <div className="p-12 text-center space-y-4">
                <button onClick={() => setRelacionarClick(!relacionarClick)} className={cn('px-8 py-3 rounded-xl border-2 font-bold transition-all', relacionarClick ? 'bg-[#3d6cf0] border-[#3d6cf0] text-white shadow-lg shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-400')}>
                  <Link2 size={18} className="inline mr-2" /> {relacionarClick ? 'Inspeção Vinculada' : 'Vincular Inspeção CLICK'}
                </button>
                {relacionarClick && <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)} className={cn(inputCls, 'mt-4 max-w-[300px] mx-auto block text-center h-12')} placeholder="Número da Inspeção" />}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER COM PROGRESSO E BOTÕES ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">
          
          {/* INDICADOR DE ETAPAS */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {tabOrder.map((key, idx) => (
                <div key={key} className={cn("h-1.5 w-6 rounded-full transition-all duration-300", idx <= currentIdx ? "bg-[#3d6cf0]" : "bg-slate-200")} />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              {completedCount} de 5 ETAPAS CONCLUÍDAS
            </span>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {currentIdx > 0 && <button onClick={() => setTab(tabOrder[currentIdx - 1])} className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">VOLTAR</button>}
            <button disabled={currentIdx === 4 ? (!allValid || isRegistering) : false} onClick={() => currentIdx < 4 ? setTab(tabOrder[currentIdx + 1]) : handleRegister()} 
              className={cn('flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black tracking-widest text-white transition-all flex items-center justify-center gap-2', 
              (currentIdx < 4 || allValid) ? 'bg-[#3d6cf0] hover:bg-[#2d5ce0] shadow-lg shadow-blue-500/20' : 'bg-slate-200 cursor-not-allowed')}>
              {isRegistering ? <Loader2 className="animate-spin" size={16} /> : currentIdx < 4 ? 'PRÓXIMO' : 'SALVAR REGISTRO'}
            </button>
          </div>
        </div>

        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Sucesso!</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">A medida administrativa foi processada e salva no sistema.</p>
              <button onClick={() => router.push('/medida-administrativa/lista')} className="w-full py-4 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs tracking-widest hover:bg-[#2d5ce0]">VER LISTAGEM</button>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}