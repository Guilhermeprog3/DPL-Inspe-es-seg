'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, ShieldCheck, Wrench, CheckCircle, CheckCircle2,
  XCircle, MinusCircle, AlertCircle, Loader2,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos / Config ───────────────────────────────────────────────────────────
type RespostaKey = 'sim' | 'nao' | 'na' // Sincronizado com seu banco
type AcaoStatusKey = 'A ATRIBUIR' | 'A INICIAR' | 'EM ANDAMENTO' | 'CANCELADO' | 'CONCLUIDO' | ''

type ItemChecklist = { id: string; pergunta: string; resposta: RespostaKey | '' }

type AcaoCorretiva = {
  id?: string
  status: AcaoStatusKey
  dataVencimento: string
  titulo: string
  descricao: string
  numNC: string
  empresaResponsavel: string
  nomeResponsavel: string
  emailsCopia: string
}

const STATUS_OPTIONS: { value: AcaoStatusKey; label: string; color: string }[] = [
  { value: 'A ATRIBUIR',   label: 'A Atribuir',   color: '#6b7a90' },
  { value: 'A INICIAR',    label: 'A Iniciar',     color: '#3b82f6' },
  { value: 'EM ANDAMENTO', label: 'Em Andamento',  color: '#f59e0b' },
  { value: 'CANCELADO',    label: 'Cancelado',     color: '#ef4444' },
  { value: 'CONCLUIDO',    label: 'Concluído',     color: '#10b981' },
]

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Extintor': { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'Hidrante': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'Botoeiras e Sirenes': { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  'Detector de Fumaça': { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
}

const TABS = [
  { key: 'checklist' as const, label: 'Inspeção',    icon: ClipboardList },
  { key: 'acao'      as const, label: 'Ação Corretiva',  icon: Wrench        },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditarInspecaoPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [tab, setTab] = useState<TabKey>('checklist')

  const [equipamento, setEquipamento] = useState('')
  const [equipId, setEquipId] = useState('')
  const [tipo, setTipo] = useState('')
  const [inspetor, setInspetor] = useState('')
  const [regional, setRegional] = useState('')
  const [dataInspecao, setDataInspecao] = useState('')
  const [itens, setItens] = useState<ItemChecklist[]>([])
  
  const [acao, setAcao] = useState<AcaoCorretiva>({
    status: '', dataVencimento: '', titulo: '', descricao: '',
    numNC: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '',
  })

  // ── Fetch Inicial ──
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !session) return
      setLoading(true)
      try {
        const token = (session as any)?.access_token || (session as any)?.accessToken
        const res = await fetch(`http://localhost:3001/inspecoes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error()
        const data = await res.json()

        setEquipamento(data.localNome)
        setEquipId(data.equipamento?.codigo || '')
        setTipo(data.equipamento?.tipo || 'Extintor')
        setInspetor(`${data.inspetor?.nome} ${data.inspetor?.sobrenome}`)
        setRegional(data.regional)
        setDataInspecao(data.data.split('T')[0])
        
        // Parse das respostas JSON
        const respostasParsed = JSON.parse(data.respostas || '[]')
        setItens(respostasParsed.map((c: any) => ({ 
          id: c.id, 
          pergunta: c.pergunta, 
          resposta: (c.resposta === 'ok' ? 'sim' : c.resposta) as RespostaKey | '' 
        })))

        // Se houver ação corretiva (pega a primeira da lista)
        if (data.acoesCorretivas && data.acoesCorretivas.length > 0) {
          const a = data.acoesCorretivas[0]
          setAcao({
            id: a.id,
            status: a.status as AcaoStatusKey,
            dataVencimento: a.dataVencimento ? a.dataVencimento.split('T')[0] : '',
            titulo: a.titulo,
            descricao: a.descricao,
            numNC: a.numNC || '',
            empresaResponsavel: a.empresaResponsavel,
            nomeResponsavel: a.nomeResponsavel,
            emailsCopia: a.emailsCopia || '',
          })
        }
      } catch (error) {
        console.error('Falha ao carregar inspeção:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, session])

  // ── Handlers ──
  const handleToggle = (itemId: string, valor: RespostaKey) => {
    setItens(prev => prev.map(i => i.id === itemId ? { ...i, resposta: valor } : i))
  }

  const itensNaoConformes = itens.filter(i => i.resposta === 'nao')
  const temNaoConformidade = itensNaoConformes.length > 0
  const progressoPct = itens.length > 0 ? Math.round((itens.filter(i => i.resposta !== '').length / itens.length) * 100) : 0
  const checklistOk = itens.length > 0 && itens.every(i => i.resposta !== '')
  const acaoOk = !temNaoConformidade || (acao.status !== '' && !!acao.dataVencimento && !!acao.titulo && !!acao.descricao)

  const tabValid: Record<TabKey, boolean> = { checklist: checklistOk, acao: acaoOk }
  const tabOrder: TabKey[] = temNaoConformidade ? ['checklist', 'acao'] : ['checklist']
  const currentIdx = tabOrder.indexOf(tab) === -1 ? 0 : tabOrder.indexOf(tab)
  const allValid = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length
  const tipoCfg = TIPO_CONFIG[tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      
      // Mapeia de volta para o formato que o backend espera (convertendo 'sim' para 'ok' se necessário)
      const payload = {
        data: dataInspecao ? new Date(dataInspecao).toISOString() : new Date().toISOString(),
        status: itens.filter(i => i.resposta === 'nao').length >= 3 ? 'REPROVADO' : (temNaoConformidade ? 'ATENCAO' : 'APROVADO'),
        respostas: itens.map(i => ({
            id: i.id,
            pergunta: i.pergunta,
            resposta: i.resposta
        })),
        // Se houver ação, envia no formato de atualização
        acaoCorretiva: temNaoConformidade ? {
            ...acao,
            dataVencimento: acao.dataVencimento ? new Date(acao.dataVencimento).toISOString() : null
        } : null
      }

      const res = await fetch(`http://localhost:3001/inspecoes/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()
      setSuccessModal(true)
    } catch (error) {
      alert('Erro ao salvar as alterações no servidor.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputCls = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls = 'text-[13.5px] font-medium text-[#111827]'

  if (loading) return (
    <DashboardLayout title="Editar Inspeção">
      <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={36} className="animate-spin text-[#3d6cf0]" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Editar Inspeção">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        .scale-in { animation: scaleIn 0.15s ease forwards; }
      ` }} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/inspecao/lista')} className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
              <ArrowLeft size={14} /> Inspeções
            </button>
            <span className="text-[11px]">›</span>
            <button onClick={() => router.push(`/inspecao/detalhes/${id}`)} className="hover:text-[#3d6cf0] transition-colors font-medium">
              {id.slice(-8).toUpperCase()}
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Editar</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa {currentIdx + 1} de {tabOrder.length}</span>
        </div>

        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] transition-all -mb-px', tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold' : 'text-[#9ca3af] border-transparent hover:text-[#374151]')}>
              {t.label}
              {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">
          {tab === 'checklist' && (
            <div className="fade-up space-y-4 max-w-4xl mx-auto">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Equipamento Inspecionado</div>
                <div className="px-6 py-4 flex items-center justify-between border-b border-[#f1f5f9]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0" style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}>
                      <ShieldCheck size={18} style={{ color: tipoCfg.color }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-[#111827]">{equipamento}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border" style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}>{tipo}</span>
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
                <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                  <span className={labelCls}>Data da Inspeção *</span>
                  <input type="date" value={dataInspecao} onChange={e => setDataInspecao(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
                </div>
                <div className="px-6 pb-4 border-t border-[#e3e8ef] pt-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1.5">
                    <span>Progresso</span>
                    <span>{itens.filter(i => i.resposta !== '').length}/{itens.length} itens · {progressoPct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressoPct}%`, background: progressoPct === 100 ? '#10b981' : '#3d6cf0' }} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Itens de Verificação</div>
                <div className="divide-y divide-[#f1f5f9]">
                  {itens.map((item, idx) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#fafbff]">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-[10px] font-black text-[#d1d5db] w-5 flex-shrink-0 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                        <p className="text-[13.5px] font-medium text-[#111827] leading-snug">{item.pergunta}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleToggle(item.id, 'sim')} className={cn('w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all', item.resposta === 'sim' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-[#e3e8ef] text-[#d1d5db]')}><CheckCircle2 size={14} /></button>
                        <button onClick={() => handleToggle(item.id, 'nao')} className={cn('w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all', item.resposta === 'nao' ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-[#e3e8ef] text-[#d1d5db]')}><XCircle size={14} /></button>
                        <button onClick={() => handleToggle(item.id, 'na')} className={cn('w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all', item.resposta === 'na' ? 'bg-slate-500 border-slate-500 text-white' : 'bg-white border-[#e3e8ef] text-[#d1d5db]')}><MinusCircle size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'acao' && (
            <div className="fade-up space-y-4 max-w-4xl mx-auto">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Status da Ação *</div>
                <div className="p-4 space-y-1.5">
                  {STATUS_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => setAcao(a => ({ ...a, status: opt.value }))} className={cn('p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all', acao.status === opt.value ? 'border-[#3d6cf0] bg-blue-50/50' : 'border-slate-50 hover:border-slate-100')}>
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />
                        <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                      </div>
                      {acao.status === opt.value && <CheckCircle size={16} className="text-[#3d6cf0]" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Detalhes da Ação</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Data Limite *</span>
                    <input type="date" value={acao.dataVencimento} onChange={e => setAcao(a => ({ ...a, dataVencimento: e.target.value }))} className={cn(inputCls, 'max-w-[200px]')} />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Título da Ação *</span>
                    <input type="text" value={acao.titulo} onChange={e => setAcao(a => ({ ...a, titulo: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="grid gap-4 items-start px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={cn(labelCls, 'mt-2')}>Descrição Detalhada *</span>
                    <textarea value={acao.descricao} onChange={e => setAcao(a => ({ ...a, descricao: e.target.value }))} rows={4} className={cn(inputCls, 'h-auto py-2.5 resize-none')} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Responsável</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Não Conformidade</span>
                    <select value={acao.numNC} onChange={e => setAcao(a => ({ ...a, numNC: e.target.value }))} className={inputCls}>
                      <option value="">— Selecionar —</option>
                      {itensNaoConformes.map((nc, i) => <option key={nc.id} value={nc.id}>{i + 1} — {nc.pergunta}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Empresa Responsável *</span>
                    <input type="text" value={acao.empresaResponsavel} onChange={e => setAcao(a => ({ ...a, empresaResponsavel: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nome do Responsável *</span>
                    <input type="text" value={acao.nomeResponsavel} onChange={e => setAcao(a => ({ ...a, nomeResponsavel: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {tabOrder.map(key => <div key={key} className={cn('h-1.5 w-6 rounded-full transition-all', tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200')} />)}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Etapas: {completedCount}/{tabOrder.length}</span>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {currentIdx > 0 && <button onClick={() => setTab(tabOrder[currentIdx - 1])} className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500">VOLTAR</button>}
            <button disabled={!allValid || isSaving} onClick={tab === 'checklist' && temNaoConformidade ? () => setTab('acao') : handleSave} className={cn('flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2', allValid ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed')}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : (tab === 'checklist' && temNaoConformidade ? 'PRÓXIMO' : 'SALVAR ALTERAÇÕES')}
            </button>
          </div>
        </div>

        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="text-emerald-500" /></div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Salvo!</h3>
              <p className="text-slate-500 text-sm mb-8">As alterações foram salvas com sucesso.</p>
              <div className="flex gap-3">
                <button onClick={() => router.push('/inspecao/lista')} className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs">VER LISTA</button>
                <button onClick={() => router.push(`/inspecao/detalhes/${id}`)} className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs">VER DETALHES</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}