'use client'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumb?: string
}

export function DashboardLayout({ children, title, breadcrumb }: DashboardLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(prev => !prev)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded(prev => !prev)}
        />
        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  )
}