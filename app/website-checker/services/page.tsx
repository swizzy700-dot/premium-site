 "use client";

import Link from "next/link";
import { getServicePreviews } from "@/lib/services";

export default function WebsiteCheckerServices() {
  const previews = getServicePreviews();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-7">
        <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Services</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-light text-neutral-950">Professional improvements your audit recommends</h1>
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Pick the area your audit flagged first. Then we implement prioritized changes designed to improve
          both user experience and lead conversion.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((service, idx) => (
            <Link
              key={service.id}
              href="/website-checker/quotation"
              className="group rounded-3xl border border-neutral-200 bg-neutral-50 p-5 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-3 text-lg text-neutral-900 font-medium">{service.title}</div>
                  <div className="mt-2 text-sm text-neutral-600 leading-relaxed">{service.subtitle}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-violet-500/15 to-cyan-400/10 border border-neutral-200">
                  <svg className="h-5 w-5 text-neutral-800" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 17 17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 7h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-neutral-600 group-hover:text-neutral-700">
                Request a quote for a conversion-focused scope.
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7 rounded-3xl border border-neutral-200 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-neutral-900">Not sure which service fits?</div>
              <div className="text-sm text-neutral-600 leading-relaxed">
                Ask the AI Assistant to map your weakest score to an execution plan.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("ai-assistant:open", { detail: { focus: "services" } }))}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Talk to AI Assistant
              </button>
              <Link
                href="/website-checker/contact"
                className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

