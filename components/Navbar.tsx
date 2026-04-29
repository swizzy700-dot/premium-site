'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import LoginModal from './LoginModal';
import GetStartedModal from './GetStartedModal';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [getStartedModalOpen, setGetStartedModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-neutral-950/85 backdrop-blur-2xl border-b border-neutral-800/60'
        : 'bg-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#home" className="flex items-center gap-4">
            <Image
              src="/logo.webp"
              alt="Mainline Randy Logo"
              width={64}
              height={48}
              className="relative h-12 w-16 object-contain"
              priority
            />
            <span className="text-xs uppercase tracking-[0.45em] text-neutral-300 font-light">
              Mainline Randy
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="tel:+27659890691"
              className="text-sm text-neutral-400 font-light tracking-[0.2em] transition-colors duration-300 hover:text-white"
            >
              +27 65 989 0691
            </a>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="text-sm text-neutral-300 border border-neutral-700/70 px-4 py-3 rounded-full font-light tracking-[0.2em] transition-colors duration-300 hover:border-amber-500 hover:text-amber-500"
            >
              Login
            </button>
            <button
              onClick={() => setGetStartedModalOpen(true)}
              className="text-sm bg-amber-500 text-neutral-950 px-5 py-3 rounded-full font-light tracking-[0.2em] transition-all duration-300 hover:bg-amber-400"
            >
              Get Started
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="md:hidden p-2 text-neutral-300 transition-colors duration-300 hover:text-amber-500"
            aria-label="Toggle menu"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 rounded-full bg-current" />
              <span className="block h-0.5 w-6 rounded-full bg-current" />
              <span className="block h-0.5 w-6 rounded-full bg-current" />
            </div>
          </button>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-500 ${
          open ? 'max-h-64 opacity-100 py-4' : 'max-h-0 opacity-0'
        }`}>
          <nav className="space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm text-neutral-300 font-light tracking-[0.2em] transition-colors duration-300 hover:text-amber-500"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-neutral-800/50">
              <button
                onClick={() => {
                  setLoginModalOpen(true);
                  setOpen(false);
                }}
                className="text-sm text-neutral-300 border border-neutral-700/70 px-4 py-3 rounded-full font-light tracking-[0.2em] transition-colors duration-300 hover:border-amber-500 hover:text-amber-500"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setGetStartedModalOpen(true);
                  setOpen(false);
                }}
                className="text-sm bg-amber-500 text-neutral-950 px-4 py-3 rounded-full font-light tracking-[0.2em] transition-all duration-300 hover:bg-amber-400"
              >
                Get Started
              </button>
            </div>
          </nav>
        </div>
      </div>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <GetStartedModal isOpen={getStartedModalOpen} onClose={() => setGetStartedModalOpen(false)} />
    </header>
  );
}
