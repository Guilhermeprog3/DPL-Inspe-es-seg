'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  PlusCircle, 
  List, 
  Search, 
  ArrowRight,
  LayoutDashboard,
  Users,
  Settings
} from 'lucide-react'
import api from '@/lib/api' // Instância centralizada

const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard', href: '/medida-administrativa', icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida', href: '/medida-administrativa/nova', icon: PlusCircle },
  { label: 'Histórico', href: '/medida-administrativa/lista', icon: List },
]

const actions = [
  {
    icon: PlusCircle,
    color: '#094780',
    title: 'Nova Medida',
    description: 'Registre uma nova advertência, suspensão ou medida educativa para colaboradores.',
    cta: 'Registrar medida',
    href: '/medida-administrativa/nova',
  },
  {
    icon: List,
    color: '#10b981',
    title: 'Lista de Medidas',
    description: 'Consulte o histórico de medidas aplicadas, filtre por colaborador, tipo ou data.',
    cta: 'Ver todas',
    href: '/medida-administrativa/lista',
  },
]

export default function MedidaDashboardPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  if (!mounted) return null

  return (
    <DashboardLayout 
      title="Dashboard" 
      breadcrumb="SIGS / Medida Administrativa"
      navItems={navItems}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

        .md-wrap {
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 60px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 52px 24px 80px;
        }

        .ac-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          width: 100%;
          justify-content: center;
          margin: 0 auto;
        }

        .ac-card {
          background: #fff;
          border: 1px solid #eef0f4;
          border-radius: 24px;
          padding: 32px 28px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 16px rgba(9,71,128,0.05);
          transition: all 0.22s;
          width: 320px; 
          min-height: 260px;
          animation: mdFadeUp 0.4s ease forwards;
        }

        .ac-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(9,71,128,0.11);
          border-color: rgba(9,71,128,0.12);
        }

        .ac-icon { 
          width: 48px; height: 48px; border-radius: 14px; 
          display: flex; align-items: center; justify-content: center; 
          margin-bottom: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); 
        }

        .ac-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #0d1e33; margin-bottom: 8px; }
        .ac-desc { font-size: 13px; color: #8896ab; line-height: 1.6; flex: 1; margin-bottom: 22px; }
        .ac-cta { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; text-transform: uppercase; }

        @keyframes mdFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-wrap { position: relative; width: 100%; max-width: 520px; margin-bottom: 48px; }
        .search-input {
          width: 100%; padding: 14px 20px 14px 48px;
          border: 1px solid rgba(9,71,128,0.1); border-radius: 14px;
          outline: none; transition: all 0.2s;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
        }
        .search-input:focus { border-color: #094780; box-shadow: 0 0 0 4px rgba(9,71,128,0.05); }
      `}} />

      <div className="md-wrap">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white border border-[#eef0f4] shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#094780] animate-pulse" />
            <span style={{ fontFamily: "'Syne', sans-serif" }} className="text-[11px] font-black text-[#094780] uppercase tracking-widest">
              Gestão SESMT
            </span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif" }} className="text-3xl font-black text-[#0d1e33] text-center tracking-tight mb-2">
            Medidas Administrativas
          </h1>
        </div>

        <div className="search-wrap">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0bac8]" size={18} />
          <input 
            className="search-input" 
            type="text"
            placeholder="Pesquisar funcionalidade..."
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div className="ac-grid">
          {filtered.length > 0 ? filtered.map((a, idx) => (
            <div 
              key={a.href} 
              className="ac-card" 
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => router.push(a.href)}
              role="button"
              tabIndex={0}
            >
              <div className="ac-icon" style={{ background: `linear-gradient(135deg,${a.color} 0%, ${a.color}dd 100%)` }}>
                <a.icon size={22} color="#fff" strokeWidth={2} />
              </div>
              
              <p className="ac-title">{a.title}</p>
              <p className="ac-desc">{a.description}</p>
              
              <div className="ac-cta" style={{ color: a.color }}>
                {a.cta}
                <ArrowRight size={14} />
              </div>
            </div>
          )) : (
            <div className="py-20 text-center text-[#8896ab]">
              Nenhuma funcionalidade encontrada para "{search}".
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}