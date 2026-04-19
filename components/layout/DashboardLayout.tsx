'use client'
import { useState } from 'react'
import { Sidebar, NavItem } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumb?: string
  navItems: NavItem[]
  accentColor?: string 
}

export function DashboardLayout({ 
  children, 
  title, 
  breadcrumb, 
  navItems, 
  accentColor = '#E67A0E' 
}: DashboardLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(prev => !prev)}
        navItems={navItems}
        accentColor={accentColor}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded(prev => !prev)}
          accentColor={accentColor}
        />
        <main className="flex-1 p-4 md:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}