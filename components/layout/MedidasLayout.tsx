'use client'
import { useState } from 'react'
import { MedidaSidebar } from './MedidaSideBar'
import { MedidaTopbar } from './MedidaTopbar'

interface MedidaLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumb?: string
}

export function MedidaLayout({ children, title, breadcrumb }: MedidaLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      <MedidaSidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(prev => !prev)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MedidaTopbar
          title={title}
          breadcrumb={breadcrumb}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded(prev => !prev)}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}