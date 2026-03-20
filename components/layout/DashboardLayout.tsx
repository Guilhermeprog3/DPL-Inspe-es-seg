import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumb?: string
}

export function DashboardLayout({ children, title, breadcrumb }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <Topbar title={title} breadcrumb={breadcrumb} />
        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  )
}
