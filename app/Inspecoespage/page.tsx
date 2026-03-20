'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, CheckCircle2, AlertTriangle, XCircle,
  Clock, Eye, ChevronDown, CalendarDays, User, MapPin,
} from 'lucide-react'

/* ─── Mock data ─── */
const INSPECOES = [
  { id: 'INS-0041', equipamento: 'Extintor CO₂ – Bloco A', tipo: 'Extintor', inspetor: 'Carlos Mendes', regional: 'Metropolitana', data: '2026-03-19T10:32:00', status: 'aprovado' },
  { id: 'INS-0040', equipamento: 'Mangueira HID-12 – Pav 3', tipo: 'Hidrante', inspetor: 'Ana Souza', regional: 'Metropolitana', data: '2026-03-19T08:15:00', status: 'atencao' },
  { id: 'INS-0039', equipamento: 'Extintor Pó – Oficina', tipo: 'Extintor', inspetor: 'João Lima', regional: 'Norte', data: '2026-03-18T16:44:00', status: 'reprovado' },
  { id: 'INS-0038', equipamento: 'Sprinkler – Almoxarifado', tipo: 'Sprinkler', inspetor: 'Carlos Mendes', regional: 'Metropolitana', data: '2026-03-18T14:10:00', status: 'aprovado' },
  { id: 'INS-0037', equipamento: 'Extintor ABC – Recepção', tipo: 'Extintor', inspetor: 'Mariana Farias', regional: 'Sul', data: '2026-03-17T11:05:00', status: 'aprovado' },
  { id: 'INS-0036', equipamento: 'Detector de Fumaça – TI', tipo: 'Detector', inspetor: 'Ana Souza', regional: 'Metropolitana', data: '2026-03-17T09:22:00', status: 'pendente' },
  { id: 'INS-0035', equipamento: 'Mangueira HID-07 – Pav 1', tipo: 'Hidrante', inspetor: 'João Lima', regional: 'Norte', data: '2026-03-16T15:00:00', status: 'atencao' },
  { id: 'INS-0034', equipamento: 'Extintor CO₂ – Datacenter', tipo: 'Extintor', inspetor: 'Pedro Alves', regional: 'Metropolitana', data: '2026-03-15T13:30:00', status: 'aprovado' },
]

const STATUS_CONFIG = {
  aprovado:  { label: 'Aprovado',  icon: CheckCircle2,   color: '#10b959', bg: 'rgba(16,185,89,0.1)'  },
  atencao:   { label: 'Atenção',   icon: AlertTriangle,  color: '#E67A0E', bg: 'rgba(230,122,14,0.1)' },
  reprovado: { label: 'Reprovado', icon: XCircle,        color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  pendente:  { label: 'Pendente',  icon: Clock,          color: '#8896ab', bg: 'rgba(136,150,171,0.1)'},
} as const

const FILTERS = ['Todos', 'Aprovado', 'Atenção', 'Reprovado', 'Pendente']

const fmt = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function InspecoesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('Todos')

  const filtered = INSPECOES.filter((i) => {
    const matchSearch =
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.equipamento.toLowerCase().includes(search.toLowerCase()) ||
      i.inspetor.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      active === 'Todos' ||
      STATUS_CONFIG[i.status as keyof typeof STATUS_CONFIG].label === active
    return matchSearch && matchFilter
  })

  const counts = {
    total: INSPECOES.length,
    aprovado: INSPECOES.filter(i => i.status === 'aprovado').length,
    atencao: INSPECOES.filter(i => i.status === 'atencao').length,
    reprovado: INSPECOES.filter(i => i.status === 'reprovado').length,
  }

  return (
    <DashboardLayout title="Lista de Inspeções" breadcrumb="SIGS / Dashboard / Inspeções">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .li-wrap { font-family: 'DM Sans', sans-serif; padding: 32px 0; }

        /* summary strip */
        .li-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .li-sum-card {
          background: #fff;
          border: 1px solid rgba(9,71,128,0.08);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(9,71,128,0.05);
        }
        .li-sum-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .li-sum-val {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #0d1e33;
          line-height: 1;
        }
        .li-sum-lbl {
          font-size: 11px;
          color: #8896ab;
          font-weight: 500;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* toolbar */
        .li-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .li-search {
          flex: 1;
          min-width: 220px;
          position: relative;
        }
        .li-search input {
          width: 100%;
          height: 40px;
          border: 1px solid rgba(9,71,128,0.12);
          border-radius: 10px;
          padding: 0 14px 0 38px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2535;
          background: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .li-search input:focus { border-color: #094780; }
        .li-search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #8896ab; }

        .li-filters {
          display: flex;
          gap: 6px;
        }
        .li-filter-btn {
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid rgba(9,71,128,0.12);
          background: #fff;
          font-size: 12px;
          font-weight: 600;
          color: #6b7a90;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
        }
        .li-filter-btn:hover { border-color: #094780; color: #094780; }
        .li-filter-btn.active {
          background: #094780;
          border-color: #094780;
          color: #fff;
        }

        /* table card */
        .li-table-card {
          background: #fff;
          border: 1px solid rgba(9,71,128,0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(9,71,128,0.06);
        }
        .li-table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(9,71,128,0.07);
        }
        .li-table-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0d1e33;
        }
        .li-count-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(9,71,128,0.07);
          color: #094780;
          padding: 3px 10px;
          border-radius: 100px;
        }

        table.li-table {
          width: 100%;
          border-collapse: collapse;
        }
        .li-table thead tr {
          background: #f8fafc;
          border-bottom: 1px solid rgba(9,71,128,0.07);
        }
        .li-table thead th {
          text-align: left;
          padding: 10px 20px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #8896ab;
          white-space: nowrap;
        }
        .li-table tbody tr {
          border-bottom: 1px solid rgba(9,71,128,0.05);
          transition: background 0.12s ease;
        }
        .li-table tbody tr:last-child { border-bottom: none; }
        .li-table tbody tr:hover { background: #f8faff; }
        .li-table tbody td {
          padding: 14px 20px;
          font-size: 13px;
          color: #3a4a5c;
          vertical-align: middle;
        }

        .li-id {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #094780;
          letter-spacing: 0.3px;
        }
        .li-equip-name {
          font-weight: 600;
          color: #1a2535;
          font-size: 13px;
        }
        .li-equip-type {
          font-size: 11px;
          color: #8896ab;
          margin-top: 2px;
        }

        .li-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #6b7a90;
        }

        .li-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .li-btn-view {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(9,71,128,0.15);
          background: transparent;
          font-size: 11px;
          font-weight: 600;
          color: #094780;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
        }
        .li-btn-view:hover {
          background: #094780;
          color: #fff;
          border-color: #094780;
        }

        .li-empty {
          padding: 48px;
          text-align: center;
          color: #8896ab;
          font-size: 13px;
        }

        @keyframes liFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .li-wrap { animation: liFadeUp 0.4s ease forwards; }
      `}</style>

      <div className="li-wrap">
        {/* Summary strip */}
        <div className="li-summary">
          {[
            { label: 'Total no mês', val: counts.total, color: '#094780', bg: 'rgba(9,71,128,0.1)', icon: CalendarDays },
            { label: 'Aprovadas', val: counts.aprovado, color: '#10b959', bg: 'rgba(16,185,89,0.1)', icon: CheckCircle2 },
            { label: 'Com atenção', val: counts.atencao, color: '#E67A0E', bg: 'rgba(230,122,14,0.1)', icon: AlertTriangle },
            { label: 'Reprovadas', val: counts.reprovado, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div className="li-sum-card" key={s.label}>
                <div className="li-sum-icon" style={{ background: s.bg }}>
                  <Icon size={18} color={s.color} strokeWidth={2} />
                </div>
                <div>
                  <div className="li-sum-val">{s.val}</div>
                  <div className="li-sum-lbl">{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="li-toolbar">
          <div className="li-search">
            <Search size={15} />
            <input
              placeholder="Buscar por ID, equipamento ou inspetor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="li-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`li-filter-btn${active === f ? ' active' : ''}`}
                onClick={() => setActive(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="li-table-card">
          <div className="li-table-head">
            <span className="li-table-title">Inspeções</span>
            <span className="li-count-badge">{filtered.length} registros</span>
          </div>
          {filtered.length === 0 ? (
            <div className="li-empty">Nenhuma inspeção encontrada.</div>
          ) : (
            <table className="li-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipamento</th>
                  <th>Inspetor</th>
                  <th>Regional</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ins) => {
                  const s = STATUS_CONFIG[ins.status as keyof typeof STATUS_CONFIG]
                  const Icon = s.icon
                  return (
                    <tr key={ins.id}>
                      <td><span className="li-id">{ins.id}</span></td>
                      <td>
                        <div className="li-equip-name">{ins.equipamento}</div>
                        <div className="li-equip-type">{ins.tipo}</div>
                      </td>
                      <td>
                        <div className="li-meta">
                          <User size={12} />
                          {ins.inspetor}
                        </div>
                      </td>
                      <td>
                        <div className="li-meta">
                          <MapPin size={12} />
                          {ins.regional}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#8896ab' }}>{fmt(ins.data)}</td>
                      <td>
                        <span className="li-status-badge" style={{ background: s.bg, color: s.color }}>
                          <Icon size={11} strokeWidth={2.5} />
                          {s.label}
                        </span>
                      </td>
                      <td>
                        <button
                          className="li-btn-view"
                          onClick={() => router.push(`/inspecao/${ins.id}`)}
                        >
                          <Eye size={12} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}