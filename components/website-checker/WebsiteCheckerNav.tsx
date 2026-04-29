"use client";

import Link from "next/link";

export default function WebsiteCheckerNav() {
  return (
    <div className="fixed top-0 inset-x-0 z-[95]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(2,6,23,0.10)]">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/website-checker"
              className="flex items-center gap-3 group"
              aria-label="Website Checker Home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 ring-1 ring-neutral-200">
                <svg className="h-5 w-5 text-neutral-900/90" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M10 6h10M10 12h10M10 18h10M4 6h.01M4 12h.01M4 18h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-medium text-neutral-900">Website Checker</span>
                <span className="block text-xs text-neutral-500">AI audit + lead conversion</span>
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden md:inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Back to Main Website
              </Link>

              <Link
                href="/website-checker/services"
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Services
              </Link>
              <Link
                href="/website-checker/contact"
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/website-checker/quotation"
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Quotation
              </Link>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("ai-assistant:open", { detail: {} }))}
                className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1.5 text-xs font-medium text-neutral-950 hover:opacity-95 transition-opacity"
              >
                AI Assistant Chat
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

