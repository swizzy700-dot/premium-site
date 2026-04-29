"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const LEAD_KEY = "website-checker:last-lead";

export default function WebsiteCheckerContact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => {
    const eOk = email.trim().includes("@") && email.trim().includes(".");
    return name.trim().length >= 2 && eOk && message.trim().length >= 10;
  }, [name, email, message]);

  function persistLead() {
    try {
      window.localStorage.setItem(
        LEAD_KEY,
        JSON.stringify({
          name,
          email,
          website: website.trim(),
          message,
          createdAt: Date.now(),
        }),
      );
    } catch {
      // ignore
    }
  }

  function submit() {
    persistLead();
    setSubmitted(true);

    const subject = `Website Checker - Consultation Request (${name.trim()})`;
    const body = `Name: ${name}\nEmail: ${email}\nWebsite: ${website}\n\nMessage:\n${message}\n`;
    const mailto = `mailto:mainlinerandyptyltd@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body,
    )}`;
    // Open mail client; also keeps this app backend-free.
    window.location.href = mailto;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-7">
        <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Contact</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-light text-neutral-950">Talk to an expert</h1>
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Tell us what you need. We’ll respond with an execution plan built around your audit’s weakest score and
          conversion goals.
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.9fr] items-start">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) submit();
            }}
          >
            <div>
              <label className="block text-sm text-neutral-700">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                placeholder="Your name"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-neutral-700">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700">Website (optional)</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors resize-none min-h-[130px]"
                placeholder="What should we fix first? What outcome matters most (leads, speed, UX clarity)?"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitted}
              className="w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {submitted ? "Opening your email…" : "Talk to Expert"}
            </button>
          </form>

          <aside className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
            <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Why this converts</div>
            <div className="mt-3 space-y-4">
              <div className="text-sm text-neutral-700 leading-relaxed">
                We don’t just list issues—we prioritize what will actually improve conversions: speed that reduces drop-off,
                UX clarity that guides action, and design consistency that builds credibility.
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="text-sm text-neutral-900">Prefer the fast path?</div>
                <div className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Request a quote in minutes and we’ll confirm a conversion-focused scope.
                </div>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <Link
                    href="/website-checker/quotation"
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    Get Quote
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("ai-assistant:open", { detail: { focus: "expert" } }))}
                    className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity"
                  >
                    Ask Assistant
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

