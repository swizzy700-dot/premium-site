"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LighthouseClientAudit, LighthouseScoreKey } from "@/lib/website-checker/lighthouse/types";

const LAST_AUDIT_KEY = "website-checker:last-audit";
const LEAD_KEY = "website-checker:last-lead";

type QuoteForm = {
  website: string;
  businessName: string;
  email: string;
  budget: string;
  notes: string;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function WebsiteCheckerQuotation() {
  const [audit, setAudit] = useState<LighthouseClientAudit | null>(null);
  const [form, setForm] = useState<QuoteForm>({
    website: "",
    businessName: "",
    email: "",
    budget: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const a = safeParse<LighthouseClientAudit>(window.localStorage.getItem(LAST_AUDIT_KEY));
    const lead = safeParse<{ name?: string; email?: string; website?: string; message?: string }>(
      window.localStorage.getItem(LEAD_KEY),
    );
    const t = window.setTimeout(() => {
      setAudit(a);
      setForm((prev) => ({
        ...prev,
        website: lead?.website ?? a?.url ?? prev.website,
        businessName: lead?.name ?? a?.businessName ?? prev.businessName,
        email: lead?.email ?? prev.email,
        notes: lead?.message ?? prev.notes,
      }));
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const canSubmit = useMemo(() => {
    const okEmail = form.email.trim().includes("@") && form.email.trim().includes(".");
    return form.website.trim().length > 5 && okEmail && form.budget.trim().length > 0;
  }, [form.website, form.email, form.budget]);

  const worstKey = useMemo(() => {
    if (!audit || !audit.scores || typeof audit.scores !== 'object') return null;
    const keys = Object.keys(audit.scores) as LighthouseScoreKey[];
    return keys.slice().sort((a, b) => audit.scores[a].score - audit.scores[b].score)[0] ?? null;
  }, [audit]);

  const worstLabel = worstKey ? audit?.scores[worstKey]?.label : null;

  function submit() {
    const subject = `Website Checker - Quote Request (${form.businessName || "New Lead"})`;
    const body = [
      `Website: ${form.website}`,
      `Business: ${form.businessName || "-"}`,
      `Email: ${form.email}`,
      `Budget: ${form.budget}`,
      `Notes: ${form.notes || "-"}`,
      "",
      audit
        ? `Audit highlights: biggest leverage = ${worstKey ? (worstKey === "best-practices" ? "Best Practices" : worstKey.toUpperCase()) : "-"}, ` +
          `scores: Performance ${audit.scores.performance.score}/100, SEO ${audit.scores.seo.score}/100, Accessibility ${audit.scores.accessibility.score}/100, Best Practices ${audit.scores["best-practices"].score}/100`
        : "Audit highlights: (no saved audit found)",
    ].join("\n");

    const mailto = `mailto:mainlinerandyptyltd@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body,
    )}`;
    setSubmitted(true);
    window.localStorage.setItem(
      LEAD_KEY,
      JSON.stringify({
        website: form.website,
        email: form.email,
        name: form.businessName,
        message: form.notes,
        createdAt: Date.now(),
      }),
    );
    window.location.href = mailto;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-7">
        <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Quotation</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-light text-neutral-950">Get a professional quote</h1>
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Based on your Website Checker audit, we’ll propose a conversion-focused scope for the area with the
          highest leverage.
        </p>

        {audit ? (
          <div className="mt-7 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <div className="text-sm text-neutral-800">Your latest audit</div>
            <div className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Biggest leverage:{" "}
              <span className="text-neutral-900 font-medium">{worstKey ? (worstKey === "best-practices" ? "Best Practices" : worstKey.toUpperCase()) : "—"}</span>
              {worstLabel ? (
                <>
                  {" "}
                  ({worstLabel})
                </>
              ) : null}
              .
              <div className="mt-2 text-sm text-neutral-600">
                Performance {audit.scores?.performance?.score ?? 0}/100 • SEO {audit.scores?.seo?.score ?? 0}/100 • Accessibility{" "}
                {audit.scores?.accessibility?.score ?? 0}/100 • Best Practices {audit.scores?.["best-practices"]?.score ?? 0}/100
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.95fr] items-start">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-neutral-700">Website URL</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700">Business Name</label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                  placeholder="Acme Digital Agency"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700">Budget range</label>
              <select
                value={form.budget}
                onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                required
              >
                <option value="">Select a range</option>
                <option value="Under $1,500">Under $1,500</option>
                <option value="$1,500 - $4,000">$1,500 - $4,000</option>
                <option value="$4,000 - $10,000">$4,000 - $10,000</option>
                <option value="10,000+">$10,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-700">What outcome matters most?</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors resize-none min-h-[120px]"
                placeholder="More qualified leads, faster pages, clearer UX, or a full premium design refresh…"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitted}
              className="w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {submitted ? "Opening your quote request…" : "Request Quotation"}
            </button>
          </form>

          <aside className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
            <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">How we’ll respond</div>
            <div className="mt-3 space-y-4">
              <div className="text-sm text-neutral-700 leading-relaxed">
                1) We review the audit and identify the highest leverage fixes.
              </div>
              <div className="text-sm text-neutral-700 leading-relaxed">
                2) We propose a conversion-focused scope aligned with your budget and timeline.
              </div>
              <div className="text-sm text-neutral-700 leading-relaxed">
                3) You get clear deliverables and next steps—so you can move quickly.
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-sm text-neutral-900">Need help deciding?</div>
              <div className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Ask the AI Assistant to prioritize SEO vs Speed vs UX vs Design, then return here for a quote.
              </div>
              <div className="mt-4 flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("ai-assistant:open", { detail: { focus: "quotation" } }))}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  Ask Assistant
                </button>
                <Link
                  href="/website-checker/services"
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  View Services
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

