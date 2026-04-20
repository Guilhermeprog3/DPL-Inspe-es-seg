// ─── admin/usuarios/page.tsx ─────────────────────────────────────────────────
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Users, Plus, MoreVertical, Edit2, Trash2, ShieldCheck, ShieldOff,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckCircle, XCircle, Clock, X, LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

// ─── Tipos ───────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 30] as const
type PageSize = typeof PAGE_SIZE_OPTIONS[number]

// ─── Nav ─────────────────────────────────────────────────────────────────────
const navItems = [
  { section: 'Administração' },
  { label: 'Dashboard',         href: '/modulos',              icon: LayoutDashboard },
  { section: 'Usuários' },
  { label: 'Lista de Usuários', href: '/admin/usuarios',       icon: Users },
  { label: 'Novo Usuário',      href: '/admin/usuarios/novo',  icon: Plus },
]

// ─── Configs visuais ──────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  ativo:     { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Ativo',     icon: <CheckCircle size={11} /> },
  inativo:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Pendente',  icon: <Clock       size={11} /> },
  bloqueado: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Bloqueado', icon: <XCircle     size={11} /> },
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  admin:        { label: 'Administrador', color: '#7c3aed', bg: '#f5f3ff' },
  inspetor:     { label: 'Inspetor',      color: '#0891b2', bg: '#ecfeff' },
  sesmt:        { label: 'SESMT',         color: '#10b981', bg: '#f0fdf4' },
  agente_cobli: { label: 'Agente Cobli',  color: '#E67A0E', bg: '#fff7ed' },
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['inativo']
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role] ?? { label: role, color: '#4b5563', bg: '#f8fafc' }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ user, onEdit, onDelete, onToggleStatus }: {
  user: any
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: (status: string) => void
}) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (document.getElementById('usr-menu')?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = () => setOpen(false)
    window.addEventListener('scroll', h, true)
    return () => window.removeEventListener('scroll', h, true)
  }, [open])

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleOpen}
        className={cn('p-2 rounded-xl transition-all',
          open ? 'bg-[#f0f4f9] text-[#094780]' : 'text-[#b0bac8] hover:text-[#094780] hover:bg-[#f0f4f9]')}>
        <MoreVertical size={18} />
      </button>

      {open && (
        <div id="usr-menu" style={{
          position: 'fixed', top: coords.top, right: coords.right,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,.12)', zIndex: 9999,
          width: '185px', overflow: 'hidden',
        }}>
          <button type="button" onClick={() => { setOpen(false); onEdit() }}
            className="w-full px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left">
            <Edit2 size={13} className="text-slate-400" /> Editar usuário
          </button>

          {(user.status === 'inativo' || user.status === 'bloqueado') && (
            <button type="button" onClick={() => { setOpen(false); onToggleStatus('ativo') }}
              className="w-full px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors text-left">
              <ShieldCheck size={13} /> Ativar acesso
            </button>
          )}

          {user.status === 'ativo' && (
            <button type="button" onClick={() => { setOpen(false); onToggleStatus('bloqueado') }}
              className="w-full px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors text-left">
              <ShieldOff size={13} /> Bloquear acesso
            </button>
          )}

          <div className="h-px bg-slate-100 mx-3 my-1" />

          <button type="button" onClick={() => { setOpen(false); onDelete() }}
            className="w-full px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-red-500 hover:bg-red-50 transition-colors text-left">
            <Trash2 size={13} /> Excluir usuário
          </button>
        </div>
      )}
    </>
  )
}

// ─── Paginação ────────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }: {
  currentPage: number; totalPages: number; totalItems: number
  pageSize: PageSize; onPageChange: (p: number) => void; onPageSizeChange: (s: PageSize) => void
}) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalItems)

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const r: (number | '...')[] = [1]
    if (currentPage > 3) r.push('...')
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) r.push(p)
    if (currentPage < totalPages - 2) r.push('...')
    r.push(totalPages)
    return r
  }, [currentPage, totalPages])

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-t border-[#f1f5f9]">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[12px] text-[#8896ab]">
          Exibindo <strong>{from}–{to}</strong> de <strong>{totalItems}</strong>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#8896ab]">por página:</span>
          <div className="flex gap-1">
            {PAGE_SIZE_OPTIONS.map(s => (
              <button key={s} onClick={() => onPageSizeChange(s)}
                className={cn('h-7 w-9 rounded-lg border text-[11px] font-bold transition-all',
                  pageSize === s
                    ? 'bg-[#094780] border-[#094780] text-white'
                    : 'bg-white border-[#e3e8ef] text-[#8896ab] hover:border-[#094780] hover:text-[#094780]')}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e3e8ef] bg-white text-[#6b7a90] hover:border-[#094780] hover:text-[#094780] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronLeft size={14} />
          </button>
          {pages.map((p, i) => p === '...'
            ? <span key={`e${i}`} className="px-1 text-[#8896ab] text-[13px]">…</span>
            : <button key={p} onClick={() => onPageChange(p as number)}
                className={cn('h-8 min-w-[32px] px-1 rounded-lg border text-[12px] font-semibold transition-all',
                  p === currentPage
                    ? 'bg-[#094780] border-[#094780] text-white'
                    : 'bg-white border-[#e3e8ef] text-[#374151] hover:border-[#094780] hover:text-[#094780]')}>
                {p}
              </button>
          )}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e3e8ef] bg-white text-[#6b7a90] hover:border-[#094780] hover:text-[#094780] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListaUsuariosPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [usuarios,        setUsuarios       ] = useState<any[]>([])
  const [loading,         setLoading        ] = useState(true)
  const [busca,           setBusca          ] = useState('')
  const [campoBusca,      setCampoBusca     ] = useState('todos')
  const [filtroStatus,    setFiltroStatus   ] = useState('Todos')
  const [filtroRole,      setFiltroRole     ] = useState('Todos')
  const [filtroUf,        setFiltroUf       ] = useState('Todos')
  const [currentPage,     setCurrentPage    ] = useState(1)
  const [pageSize,        setPageSize       ] = useState<PageSize>(10)
  const [deleteModal,     setDeleteModal    ] = useState<any | null>(null)
  const [isDeleting,      setIsDeleting     ] = useState(false)
  const [updatingId,      setUpdatingId     ] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!session) return
      try {
        setLoading(true)
        const r = await api.get('/users')
        setUsuarios(r.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [session])

  const filteredData = useMemo(() => usuarios.filter(u => {
    const t = busca.toLowerCase()
    const matchBusca = !busca || (() => {
      switch (campoBusca) {
        case 'nome':  return `${u.nome} ${u.sobrenome}`.toLowerCase().includes(t)
        case 'email': return u.email?.toLowerCase().includes(t)
        default: return (
          `${u.nome} ${u.sobrenome}`.toLowerCase().includes(t) ||
          u.email?.toLowerCase().includes(t) ||
          u.role?.toLowerCase().includes(t) ||
          u.uf?.toLowerCase().includes(t)
        )
      }
    })()
    return (
      matchBusca &&
      (filtroStatus === 'Todos' || u.status === filtroStatus) &&
      (filtroRole   === 'Todos' || u.role   === filtroRole)   &&
      (filtroUf     === 'Todos' || u.uf     === filtroUf)
    )
  }), [usuarios, busca, campoBusca, filtroStatus, filtroRole, filtroUf])

  useEffect(() => { setCurrentPage(1) }, [busca, campoBusca, filtroStatus, filtroRole, filtroUf, pageSize])

  const totalPages    = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = useMemo(() =>
    filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  , [filteredData, currentPage, pageSize])

  const filtrosAtivos = [busca, filtroStatus !== 'Todos', filtroRole !== 'Todos', filtroUf !== 'Todos'].filter(Boolean).length
  const limparFiltros = () => { setBusca(''); setCampoBusca('todos'); setFiltroStatus('Todos'); setFiltroRole('Todos'); setFiltroUf('Todos') }

  const counts = useMemo(() => ({
    total:     usuarios.length,
    ativos:    usuarios.filter(u => u.status === 'ativo').length,
    pendentes: usuarios.filter(u => u.status === 'inativo').length,
    bloqueados:usuarios.filter(u => u.status === 'bloqueado').length,
  }), [usuarios])

  async function handleToggleStatus(user: any, novoStatus: string) {
    setUpdatingId(user.id)
    try {
      await api.patch(`/users/${user.id}`, { status: novoStatus })
      setUsuarios(p => p.map(u => u.id === user.id ? { ...u, status: novoStatus } : u))
    } catch { alert('Erro ao atualizar status.') }
    finally { setUpdatingId(null) }
  }

  async function handleDelete() {
    if (!deleteModal) return
    setIsDeleting(true)
    try {
      await api.delete(`/users/${deleteModal.id}`)
      setUsuarios(p => p.filter(u => u.id !== deleteModal.id))
      setDeleteModal(null)
    } catch { alert('Erro ao excluir usuário.') }
    finally { setIsDeleting(false) }
  }

  const inputCls = 'h-9 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg px-3 text-[13px] outline-none focus:border-[#094780] transition-all w-full'

  return (
    <DashboardLayout title="Gestão de Usuários" navItems={navItems} accentColor="#094780">
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[22px] font-bold text-[#0d1e33]">Usuários do Sistema</h2>
            <p className="text-[12px] text-[#8896ab] font-semibold uppercase mt-0.5">
              {loading ? 'Carregando...' : `${filteredData.length} usuários encontrados`}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/usuarios/novo')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-bold hover:bg-[#0a5494] transition-all shadow-sm">
            <Plus size={15} strokeWidth={3} /> Novo Usuário
          </button>
        </div>

        {/* ── Cards de contadores ── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',      val: counts.total,      color: '#3d6cf0', bg: '#eef2ff', icon: <Users     size={17} /> },
              { label: 'Ativos',     val: counts.ativos,     color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle size={17} /> },
              { label: 'Pendentes',  val: counts.pendentes,  color: '#f59e0b', bg: '#fffbeb', icon: <Clock      size={17} /> },
              { label: 'Bloqueados', val: counts.bloqueados, color: '#ef4444', bg: '#fef2f2', icon: <XCircle    size={17} /> },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e3e8ef] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-[20px] font-black text-[#0d1e33] leading-none">{s.val}</div>
                  <div className="text-[11px] text-[#8896ab] font-semibold mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-600 uppercase tracking-wider">
              <SlidersHorizontal size={13} /> Filtros
              {filtrosAtivos > 0 && (
                <span className="bg-[#3d6cf0] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{filtrosAtivos}</span>
              )}
            </div>
            {filtrosAtivos > 0 && (
              <button onClick={limparFiltros} className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                Limpar
              </button>
            )}
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Busca */}
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Busca</span>
              <div className="flex border border-[#e3e8ef] rounded-lg overflow-hidden h-9 bg-[#f8fafc] focus-within:border-[#094780] transition-colors">
                <select value={campoBusca} onChange={e => setCampoBusca(e.target.value)}
                  className="border-none bg-transparent text-[11px] font-bold text-[#094780] pl-2 pr-1 outline-none shrink-0">
                  <option value="todos">Todos</option>
                  <option value="nome">Nome</option>
                  <option value="email">E-mail</option>
                </select>
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  className="flex-1 bg-transparent border-none px-2 text-[12.5px] outline-none min-w-0"
                  placeholder="Pesquisar..." />
                {busca && (
                  <button onClick={() => setBusca('')} className="px-2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
              <select className={inputCls} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Pendente</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>

            {/* Perfil */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Perfil</span>
              <select className={inputCls} value={filtroRole} onChange={e => setFiltroRole(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="admin">Administrador</option>
                <option value="inspetor">Inspetor</option>
                <option value="sesmt">SESMT</option>
                <option value="agente_cobli">Agente Cobli</option>
              </select>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
              <select className={inputCls} value={filtroUf} onChange={e => setFiltroUf(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="PI">Piauí</option>
                <option value="MA">Maranhão</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Tabela ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-[#9ca3af]">
              <Loader2 size={32} className="animate-spin text-[#094780]" />
              <span className="text-[13px]">Carregando usuários...</span>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-6">
              <AlertCircle size={32} className="text-slate-300" />
              <p className="text-[14px] font-semibold text-slate-400">Nenhum usuário encontrado</p>
              <p className="text-[12px] text-slate-300">Tente ajustar os filtros</p>
              {filtrosAtivos > 0 && (
                <button onClick={limparFiltros}
                  className="mt-2 px-4 py-2 text-[12px] font-bold text-[#094780] border border-[#094780]/30 rounded-lg hover:bg-blue-50 transition-colors">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 800 }}>
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                      <th className="px-5 py-3 text-left text-[10px] font-black text-[#8896ab] uppercase tracking-widest">Usuário</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-[#8896ab] uppercase tracking-widest">E-mail</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-[#8896ab] uppercase tracking-widest">Perfil</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-[#8896ab] uppercase tracking-widest">Regional</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-[#8896ab] uppercase tracking-widest">Status</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black text-[#8896ab] uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map(user => (
                      <tr key={user.id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#fafbfc] transition-colors">

                        {/* Usuário */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[12px] shrink-0"
                              style={{ background: ROLE_CFG[user.role]?.color ?? '#6b7a8d' }}>
                              {(user.nome?.charAt(0) ?? '?').toUpperCase()}{(user.sobrenome?.charAt(0) ?? '').toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#1a2535]">{user.nome} {user.sobrenome}</div>
                              <div className="text-[10px] text-[#8896ab]">#{String(user.id).slice(-6).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] text-[#374151]">{user.email}</span>
                        </td>

                        {/* Perfil */}
                        <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>

                        {/* Regional */}
                        <td className="px-5 py-3.5">
                          <div className="text-[12px] font-semibold text-[#374151]">{user.uf || '—'}</div>
                          <div className="text-[10px] text-[#8896ab]">{user.regional || '—'}</div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {updatingId === user.id
                            ? <Loader2 size={16} className="animate-spin text-[#094780]" />
                            : <StatusBadge status={user.status} />
                          }
                        </td>

                        {/* Ações */}
                        <td className="px-5 py-3.5 text-right">
                          <ActionMenu
                            user={user}
                            onEdit={() => router.push(`/admin/usuarios/editar/${user.id}`)}
                            onDelete={() => setDeleteModal(user)}
                            onToggleStatus={(s) => handleToggleStatus(user, s)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage} totalPages={totalPages}
                totalItems={filteredData.length} pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Modal exclusão ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#e3e8ef]">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-[16px] font-bold text-[#111827] mb-1">Excluir usuário?</h3>
              <p className="text-[13px] text-slate-400">
                <strong>{deleteModal.nome} {deleteModal.sobrenome}</strong> será removido permanentemente.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 border border-[#e3e8ef] rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                {isDeleting ? <><Loader2 size={13} className="animate-spin" /> Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}