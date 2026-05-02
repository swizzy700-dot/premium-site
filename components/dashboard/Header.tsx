'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Bell, Search, User } from 'lucide-react';

interface HeaderProps {
  user: {
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

export function DashboardHeader({ user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">WS</span>
          </div>
          <span className="font-semibold text-slate-900">WebIntel</span>
        </Link>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audits, projects..."
            className="pl-9 pr-4 py-1.5 w-64 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">{user.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowDropdown(false)}
              >
                Settings
              </Link>
              <Link
                href="/billing"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowDropdown(false)}
              >
                Billing
              </Link>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    // Logout logic
                    window.location.href = '/auth/logout';
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
