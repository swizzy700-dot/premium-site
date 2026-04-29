'use client';

import Link from 'next/link';

const navigationCards = [
  {
    title: 'Terms & Conditions',
    description: 'Our professional terms of service and agreements.',
    href: '/terms',
  },
  {
    title: 'Our Projects',
    description: 'Explore our portfolio of premium digital solutions.',
    href: '/projects',
  },
  {
    title: 'Why Choose MLR',
    description: 'Discover what sets us apart in the premium market.',
    href: '/why-choose-mlr',
  },
];

export default function AuthorityHub() {
  return (
    <section className="relative bg-neutral-950 text-white py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Brand Intro */}
        <div className="mb-20 text-center">
          <h2 className="text-6xl sm:text-7xl font-serif font-light leading-[1.05] tracking-tight mb-6">
            Mainline Randy (MLR)
          </h2>
          <p className="text-xl sm:text-2xl text-amber-500 font-light tracking-wide mb-8">
            Premium digital solutions company dedicated to crafting sophisticated, high-performance websites for businesses that value excellence, credibility, and growth.
          </p>
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-neutral-300 font-light leading-relaxed">
            <p>
              In today’s competitive landscape, a website is far more than a digital presence it is a direct reflection of your brand’s quality, professionalism, and ambition. At MLR, we specialise in transforming ideas into refined digital experiences that not only capture attention but also inspire trust and drive meaningful engagement.

Our approach is rooted in precision, attention to detail, and a deep understanding of modern business needs. Each website we create is thoughtfully designed to balance visual elegance with seamless functionality, ensuring an experience that is both impactful and intuitive.
            </p>
            <p>
              From corporate platforms and eCommerce solutions to strategic landing pages and content-driven websites, we deliver tailored digital solutions that elevate brand identity and position our clients ahead of the curve.

At MLR, we do not simply build websites we create digital assets that enhance reputation, strengthen market presence, and support long-term business success.
            </p>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid gap-12 lg:grid-cols-2 mb-20">
          <div className="space-y-6">
            <h3 className="text-4xl font-serif font-light text-amber-500">Vision</h3>
            <p className="text-lg text-neutral-300 font-light leading-relaxed">
              To establish MLR as a leading name in premium digital solutions, recognised for delivering refined, high-quality websites that empower businesses to stand out, scale, and succeed in a digital-first world.
            </p>
          </div>
          <div className="space-y-6">
            <h3 className="text-4xl font-serif font-light text-amber-500">Mission</h3>
            <p className="text-lg text-neutral-300 font-light leading-relaxed">
              Our mission is to provide exceptional website solutions that combine modern design, advanced functionality, and strategic thinking. We are committed to helping businesses build a strong, credible online presence that not only attracts attention but converts it into real opportunities.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300 font-light mb-3">How It Works</p>
            <h3 className="text-4xl font-serif font-light text-white">A simple, premium process</h3>
            <p className="max-w-2xl mx-auto text-neutral-400 text-base font-light leading-relaxed mt-4">
              Partner with MLR through a clear, structured workflow that keeps your project focused, efficient, and built for long-term success.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
            <div className="group rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center transition duration-500 hover:-translate-y-1 hover:border-amber-500/60 hover:bg-neutral-900/90">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xl font-semibold">
                1
              </div>
              <h4 className="text-xl font-serif font-light text-white mb-3">Consultation</h4>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">
                We start with a focused discovery session to understand your vision, goals, and business needs.
              </p>
            </div>
            <div className="group rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center transition duration-500 hover:-translate-y-1 hover:border-amber-500/60 hover:bg-neutral-900/90">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xl font-semibold">
                2
              </div>
              <h4 className="text-xl font-serif font-light text-white mb-3">Planning & Strategy</h4>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">
                We define the project roadmap, user experience, and technical approach to deliver a strong digital outcome.
              </p>
            </div>
            <div className="group rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center transition duration-500 hover:-translate-y-1 hover:border-amber-500/60 hover:bg-neutral-900/90">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xl font-semibold">
                3
              </div>
              <h4 className="text-xl font-serif font-light text-white mb-3">Design & Development</h4>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">
                We craft polished visuals and build responsive, high-performance web experiences that reflect your brand.
              </p>
            </div>
            <div className="group rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center transition duration-500 hover:-translate-y-1 hover:border-amber-500/60 hover:bg-neutral-900/90">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xl font-semibold">
                4
              </div>
              <h4 className="text-xl font-serif font-light text-white mb-3">Launch</h4>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">
                We deploy your site with care, validate every detail, and ensure a smooth transition to a live, polished presence.
              </p>
            </div>
            <div className="group rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center transition duration-500 hover:-translate-y-1 hover:border-amber-500/60 hover:bg-neutral-900/90">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xl font-semibold">
                5
              </div>
              <h4 className="text-xl font-serif font-light text-white mb-3">Ongoing Support</h4>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">
                After launch, we keep your site supported with updates, optimization, and continued guidance.
              </p>
            </div>
          </div>
        </div>

       

        {/* Professional Positioning */}
        <div className="mb-20">
          <h3 className="text-4xl font-serif font-light text-center text-amber-500 mb-8">
            Professional Positioning
          </h3>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-neutral-300 font-light leading-relaxed mb-6">
              Mainline Randy (MLR) is positioned as a premium digital partner for businesses that seek more than just a website but a powerful, results-driven online presence.
            </p>
            <p className="text-lg text-neutral-400 font-light leading-relaxed">
              We work with ambitious brands, growing enterprises, and forward-thinking business owners who understand that investing in quality digital infrastructure is essential for long-term success.

MLR is not designed for mass, low-cost production. Instead, we are dedicated to providing high-value, professionally executed digital solutions for clients who prioritise quality, reliability, and impact.


            </p>
          </div>
        </div>

        {/* Navigation Hub */}
        <div className="mb-20">
          <h3 className="text-4xl font-serif font-light text-center text-white mb-12">
            Explore More
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {navigationCards.map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 transition-all duration-500 hover:border-amber-500/50 hover:bg-neutral-900/80 hover:shadow-[0_20px_60px_rgba(212,175,55,0.1)] hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/5 transition-all duration-500 pointer-events-none" />
                  <div className="relative">
                    <h4 className="text-2xl font-serif font-light text-white mb-3">
                      {card.title}
                    </h4>
                    <p className="text-base text-neutral-400 font-light leading-relaxed mb-4">
                      {card.description}
                    </p>
                    <div className="flex items-center text-amber-500 group-hover:text-amber-400 transition-colors duration-300">
                      <span className="text-sm font-light tracking-wide mr-2">Learn More</span>
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

       
        
      </div>
    </section>
  );
}
