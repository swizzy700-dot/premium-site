'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  History, 
  Settings, 
  CreditCard,
  PlusCircle
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/audits', label: 'Audit History', icon: History },
  { href: '/billing', label: 'Billing & Usage', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)]">
      <div className="p-4">
        <Link
          href="/audits/new"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Audit
        </Link>
      </div>

      <nav className="px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-600 mb-1">Free Plan</p>
          <p className="text-xs text-slate-500">12 / 50 audits used</p>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '24%' }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
