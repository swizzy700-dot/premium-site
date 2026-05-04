'use client';

import Link from 'next/link';
import { getServicePreviews } from '@/lib/services';
import { Header } from "@/components/layout/Header";
export default function Services() {
  const servicePreviews = getServicePreviews();

  <p className="text-red-500">TEST WEBINTEL HERE</p>

  return (
    <section className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20">
          <p className="text-xs uppercase tracking-[0.45em] text-neutral-600 font-light mb-4">
            Our Expertise
          </p>
          <h2 className="text-5xl sm:text-6xl lg:text-6xl font-serif font-light leading-[1.1] tracking-tight text-neutral-950 max-w-3xl">
            Premium Services for Luxury Brands
          </h2>
          <p className="mt-8 max-w-2xl text-lg text-neutral-600 font-light leading-relaxed">
            Comprehensive solutions engineered for brands that demand perfection. From strategic design to performance optimization.
          </p>
        </div>

        <div className="space-y-6">
          <div className="mb-6 flex items-center justify-between">
  <p className="text-sm text-neutral-500 tracking-wide">
    Powered by WebIntel Website Intelligence
  </p>

  <Link
    href="/website-checker"
    className="text-sm text-amber-500 hover:text-amber-400 transition"
  >
    Run Website Check →
  </Link>
</div>

          {servicePreviews.map((service, index) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-8 sm:p-12 transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)] hover:shadow-amber-500/10 hover:from-neutral-800 hover:via-neutral-700 hover:to-neutral-800 group-hover:scale-[1.02]">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="inline-block">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/20 text-amber-500 font-light text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl sm:text-4xl font-serif font-light text-white leading-tight mb-2">
                        {service.title}
                      </h3>
                      {service.subtitle && (
                        <p className="text-sm uppercase tracking-[0.35em] text-amber-400 font-light">
                          {service.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 pt-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-neutral-700 text-white transition-all duration-500 group-hover:bg-amber-500 group-hover:text-neutral-950 group-hover:scale-110">
                      <svg
                        className="h-6 w-6 transition-transform duration-500 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
