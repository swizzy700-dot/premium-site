"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WebsiteCheckerOnboardingModal from "@/components/website-checker/onboarding/WebsiteCheckerOnboardingModal";

function WebsiteCheckerLandingInner() {
  const sp = useSearchParams();
  const start = sp.get("start");
  const urlParam = sp.get("url");

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
                Performance Intelligence Platform
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-light tracking-tight">
                Identify what&apos;s holding your website back.
              </h1>
              <p className="mt-4 text-neutral-600 max-w-2xl leading-relaxed">
                Enter your URL to receive a comprehensive performance assessment across speed, SEO, accessibility, and technical excellence. 
                Get actionable insights to improve conversions.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8 py-4 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity"
                >
                  Launch Analysis
                </button>
                <div className="flex items-center rounded-full border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-600">
                  Powered by Google Lighthouse Insights
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-7">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Analysis Overview</div>
              <div className="mt-4 space-y-4">
                {[
                  { k: "Performance", d: "Speed metrics that impact user retention and conversions" },
                  { k: "SEO", d: "Search visibility factors for high-intent traffic" },
                  { k: "Accessibility", d: "Inclusive design standards that expand your reach" },
                  { k: "Best Practices", d: "Technical quality signals that build trust" },
                ].map((it) => (
                  <div key={it.k} className="flex items-start gap-4">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300/70" />
                    <div>
                      <div className="text-sm text-neutral-900">{it.k} Assessment</div>
                      <div className="text-sm text-neutral-600 leading-relaxed">{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm text-neutral-700">Actionable Intelligence</div>
                <div className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Receive prioritized recommendations with clear next steps to improve performance, engage more visitors, and drive measurable results.
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
        initialUrl={urlParam || undefined}
        autoStart={start === "1"}
      />
    </div>
  );
}

export default function WebsiteCheckerLanding() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-neutral-600">Loading Performance Analysis…</div>
        </div>
      }
    >
      <WebsiteCheckerLandingInner />
    </Suspense>
  );
}

