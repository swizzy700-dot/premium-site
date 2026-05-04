'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {pathname.startsWith("/services") && (
  <Link href="/website-checker" className="flex items-center gap-2">
    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">WI</span>
    </div>
    <span className="font-semibold text-slate-900 hidden sm:block">
      WebIntel
    </span>
  </Link>
)}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/website-checker"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/website-checker') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Website Checker
            </Link>
            <Link
              href="/services"
              className={`text-sm font-medium transition-colors ${
                isActive('/services') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services
            </Link>
            <Link
              href="/why-choose-mlr"
              className={`text-sm font-medium transition-colors ${
                isActive('/why-choose-mlr') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Why Choose Us
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/website-checker"
              className="flex items-center gap-3 py-2 text-slate-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="w-5 h-5" />
              Website Checker
            </Link>
            <Link
              href="/services"
              className="block py-2 text-slate-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/why-choose-mlr"
              className="block py-2 text-slate-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Why Choose Us
            </Link>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-2 py-2 text-slate-700 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
