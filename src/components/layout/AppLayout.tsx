import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MenuIcon } from '@/components/ui/icons'

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-(--color-ink)">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="flex items-center justify-between border-b border-(--color-border) px-4 py-3 md:hidden">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <img src="/icons/logo-mark.svg" alt="" width={24} height={24} />
            <span className="font-accent text-base font-semibold text-(--color-parchment)">Bushido Tracker</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="flex size-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted)"
          >
            <MenuIcon className="size-5" />
          </button>
        </header>
        <main className="flex-grow overflow-x-hidden px-4 py-6 md:px-4 md:py-6">
          <div className="mx-auto max-w-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
