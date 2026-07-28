import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Package, BarChart3, Users, LogOut, Menu, X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/agents', label: 'Agents', icon: Users },
];

export default function Layout({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-white">
      <header className="border-b border-hairline bg-canvas-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-feature-heading text-near-black tracking-tight">AgentCart</span>
            <span className="mono-label text-muted-slate hidden sm:inline">Admin</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-caption font-medium transition-colors ${isActive ? 'text-near-black' : 'text-muted-slate hover:text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={onSignOut} className="text-muted-slate hover:text-ink transition-colors">
              <LogOut size={18} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-ink">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-hairline px-6 py-4 space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block text-body font-medium ${isActive ? 'text-near-black' : 'text-muted-slate'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}