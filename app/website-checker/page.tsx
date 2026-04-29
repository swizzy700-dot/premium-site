"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WebsiteCheckerOnboardingModal from "@/components/website-checker/onboarding/WebsiteCheckerOnboardingModal";

function WebsiteCheckerLandingInner() {
  const sp = useSearchParams();
  const start = sp.get("start");

  const router = useRouter();
  const [isOpen, setIsOpen] = useState(start === "1");

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.20),transparent_38%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_38%)] pointer-events-none" />
      <div className="relative">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700">
                <span className="h-2 w-2 rounded-full bg-violet-400/80 animate-pulse" />
                AI Audit + Lead Generation
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-light tracking-tight">
                Professional website audits that drive inquiries.
              </h1>
              <p className="mt-4 text-neutral-600 max-w-2xl leading-relaxed">
                Upload your website URL and get a conversion-focused audit across performance, SEO, accessibility, and best practices.
                Then take the next step with confidence.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8 py-4 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity"
                >
                  Check Your Website
                </button>
                <div className="flex items-center rounded-full border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-600">
                  Real-time Lighthouse scan experience.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-7">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">What you’ll see</div>
              <div className="mt-4 space-y-4">
                {[
                  { k: "Performance", d: "Faster load and more responsive interaction" },
                  { k: "SEO", d: "Discoverability for high-intent searches" },
                  { k: "Accessibility", d: "Usability that works for more visitors" },
                  { k: "Best Practices", d: "Reliability, correctness, and quality signals" },
                ].map((it) => (
                  <div key={it.k} className="flex items-start gap-4">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300/70" />
                    <div>
                      <div className="text-sm text-neutral-900">{it.k} audit</div>
                      <div className="text-sm text-neutral-600 leading-relaxed">{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm text-neutral-700">Conversion-focused next steps</div>
                <div className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  The results page pushes you toward a quote, expert conversation, and clear fixes—without pressure, just clarity.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <WebsiteCheckerOnboardingModal
        isOpen={isOpen}
        onRequestClose={() => {
          setIsOpen(false);
          router.replace("/website-checker");
        }}
      />
    </div>
  );
}

export default function WebsiteCheckerLanding() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-neutral-600">Loading Website Checker…</div>
        </div>
      }
    >
      <WebsiteCheckerLandingInner />
    </Suspense>
  );
}

