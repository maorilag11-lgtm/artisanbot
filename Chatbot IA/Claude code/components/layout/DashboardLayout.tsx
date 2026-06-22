import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  artisanName?: string
  trade?: string
}

export function DashboardLayout({ children, artisanName, trade }: DashboardLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F8FA' }}>
      <Sidebar artisanName={artisanName} trade={trade} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
