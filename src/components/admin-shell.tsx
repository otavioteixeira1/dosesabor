import { BrandMark } from './brand-mark'
import { StatusBadge } from './status-badge'
import type { StoreSettings } from '../types/store'

type AdminShellProps = {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  onSignOut: () => Promise<void>
  settings: StoreSettings
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'categorias', label: 'Categorias' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'caixa', label: 'Caixa' },
  { id: 'configuracoes', label: 'Configurações' },
]

export function AdminShell({ children, activeTab, onTabChange, onSignOut, settings }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-shell)]">
      <header className="border-b border-[var(--color-line)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <BrandMark compact />
            <StatusBadge isOpen={settings.isStoreOpen} />
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'bg-[var(--color-shell)] text-[var(--color-ink)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
